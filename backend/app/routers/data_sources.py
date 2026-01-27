from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataSource, Table, DataSourceType, DataSourceStatus
from ..schemas import DataSourceCreate, DataSourceResponse, DataSourceUpdate, TableSchema, ColumnSchema
from datetime import datetime
import uuid
import json
import tempfile
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data-sources", tags=["data-sources"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=list[DataSourceResponse])
def get_data_sources(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all data sources (filtered by entitlements in production)"""
    data_sources = db.query(DataSource).all()
    
    # TODO: Filter by entitlements based on user_id
    # For now, return all data sources
    
    # Format response to match frontend expectations
    result = []
    for source in data_sources:
        result.append({
            "id": source.id,
            "name": source.name,
            "type": source.type.value,
            "host": source.host,
            "port": source.port,
            "database": source.database,
            "username": source.username,
            "status": source.status.value,
            "lastSync": source.last_sync.isoformat() if source.last_sync else None,
            "projectId": source.project_id,
            "dataset": source.dataset,
            "location": source.location,
        })
    
    return result

@router.post("", response_model=DataSourceResponse, status_code=201)
def create_data_source(
    data_source: DataSourceCreate,
    db: Session = Depends(get_db)
):
    """Create a new data source"""
    source_id = f"source-{uuid.uuid4().hex[:12]}"
    
    db_source = DataSource(
        id=source_id,
        name=data_source.name,
        type=data_source.type,
        host=data_source.host,
        port=data_source.port,
        database=data_source.database,
        username=data_source.username,
        password=data_source.password,  # In production, encrypt this
        project_id=data_source.project_id,
        dataset=data_source.dataset,
        location=data_source.location,
        status="disconnected"
    )
    
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    # Format response to match frontend expectations
    return {
        "id": db_source.id,
        "name": db_source.name,
        "type": db_source.type.value,
        "host": db_source.host,
        "port": db_source.port,
        "database": db_source.database,
        "username": db_source.username,
        "status": db_source.status.value,
        "lastSync": db_source.last_sync.isoformat() if db_source.last_sync else None,
        "projectId": db_source.project_id,
        "dataset": db_source.dataset,
        "location": db_source.location,
    }

@router.get("/{source_id}/schema", response_model=dict)
def get_data_source_schema(
    source_id: str,
    db: Session = Depends(get_db)
):
    """Get schema (tables) for a data source.

    - For relational sources (mysql/postgresql/etc.), this returns the cached schema from the `tables` table.
    - For BigQuery, this connects live to BigQuery and lists tables/columns from the configured dataset.
    """
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Live schema inspection for BigQuery
    if db_source.type == DataSourceType.bigquery:
        try:
            from google.cloud import bigquery
            from google.oauth2 import service_account
            from google.auth.exceptions import DefaultCredentialsError
            from google.api_core.exceptions import Forbidden
        except ImportError:
            logger.exception("google-cloud-bigquery not installed during get_data_source_schema")
            raise HTTPException(
                status_code=500,
                detail="google-cloud-bigquery library not installed. Install with: pip install google-cloud-bigquery"
            )

        if not db_source.dataset:
            raise HTTPException(
                status_code=400,
                detail="BigQuery dataset is not configured for this data source"
            )

        project = db_source.project_id or db_source.host
        dataset_name = db_source.dataset

        try:
            credentials = None

            # Prefer inline service account JSON from the data source if present,
            # otherwise fall back to Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
            if db_source.password:
                logger.info("BigQuery get_data_source_schema using inline service account key", extra={
                    "source_id": db_source.id,
                })
                try:
                    service_account_info = json.loads(db_source.password)
                except json.JSONDecodeError:
                    logger.exception("Failed to parse BigQuery service account JSON during get_data_source_schema")
                    raise HTTPException(status_code=400, detail="Invalid service account key JSON")

                credentials = service_account.Credentials.from_service_account_info(service_account_info)
            else:
                logger.info("BigQuery get_data_source_schema using default credentials from environment", extra={
                    "source_id": db_source.id,
                    "env_has_google_application_credentials": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
                })

            logger.info("Creating BigQuery client for get_data_source_schema", extra={
                "source_id": db_source.id,
                "project": project,
                "dataset": dataset_name,
                "location": db_source.location,
            })

            if credentials is not None:
                client = bigquery.Client(
                    credentials=credentials,
                    project=project,
                    location=db_source.location,
                )
            else:
                client = bigquery.Client(
                    project=project,
                    location=db_source.location,
                )

            # Use INFORMATION_SCHEMA so we also include views, not just physical tables
            columns_query = f"""
                SELECT
                  table_name,
                  column_name,
                  data_type,
                  is_nullable,
                  ordinal_position
                FROM `{project}.{dataset_name}`.INFORMATION_SCHEMA.COLUMNS
                ORDER BY table_name, ordinal_position
            """

            logger.info("Querying BigQuery INFORMATION_SCHEMA.COLUMNS for get_data_source_schema", extra={
                "source_id": db_source.id,
                "project": project,
                "dataset": dataset_name,
            })

            columns_result = list(client.query(columns_query))

            tables_map: dict[str, dict] = {}

            for row in columns_result:
                table_name = row["table_name"]
                column_name = row["column_name"]
                data_type = row["data_type"]

                if table_name not in tables_map:
                    tables_map[table_name] = {
                        "name": table_name,
                        "schema": dataset_name,
                        "columns": [],
                        "rowCount": 0,  # Filled from TABLES view below if available
                        "description": None,
                    }

                tables_map[table_name]["columns"].append({
                    "name": column_name,
                    "type": data_type,
                    "primaryKey": False,  # BigQuery doesn't expose PKs in INFORMATION_SCHEMA
                    "foreignKey": None,
                    "description": None,
                })

            tables_list = list(tables_map.values())
            return {"tables": tables_list}

        except DefaultCredentialsError as e:
            logger.error("BigQuery get_data_source_schema missing default credentials", extra={
                "source_id": db_source.id,
                "error": str(e),
            })
            raise HTTPException(
                status_code=400,
                detail="Service account credentials not found. Either provide a service account key in the data source or configure GOOGLE_APPLICATION_CREDENTIALS."
            )
        except Forbidden as e:
            logger.error("BigQuery get_data_source_schema forbidden - missing jobs.create or dataset permissions", extra={
                "source_id": db_source.id,
                "error": str(e),
            })
            raise HTTPException(
                status_code=403,
                detail=(
                    "BigQuery permission denied while reading schema. "
                    "The service account must have permission to create query jobs in this project "
                    "(e.g. roles/bigquery.jobUser or roles/bigquery.user) and read the dataset."
                ),
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Unexpected error during BigQuery get_data_source_schema", extra={
                "source_id": db_source.id,
                "error": str(e),
                "error_type": type(e).__name__,
            })
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch BigQuery schema: {str(e)}"
            )

    # Default: return cached schema from local `tables` table
    tables = db.query(Table).filter(Table.data_source_id == source_id).all()

    tables_list = []
    for table in tables:
        columns_data = table.columns_json or []
        columns = [ColumnSchema(**col) for col in columns_data] if columns_data else []

        tables_list.append(TableSchema(
            name=table.name,
            schema=table.schema_name,
            columns=columns,
            row_count=table.row_count,
            description=table.description
        ).dict())

    return {"tables": tables_list}

@router.put("/{source_id}", response_model=DataSourceResponse)
def update_data_source(
    source_id: str,
    data_source: DataSourceUpdate,
    db: Session = Depends(get_db)
):
    """Update a data source"""
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    update_data = data_source.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_source.password = update_data["password"]
    
    for field, value in update_data.items():
        if field != "password":
            setattr(db_source, field, value)
    
    db.commit()
    db.refresh(db_source)
    
    # Format response to match frontend expectations
    return {
        "id": db_source.id,
        "name": db_source.name,
        "type": db_source.type.value,
        "host": db_source.host,
        "port": db_source.port,
        "database": db_source.database,
        "username": db_source.username,
        "status": db_source.status.value,
        "lastSync": db_source.last_sync.isoformat() if db_source.last_sync else None,
        "projectId": db_source.project_id,
        "dataset": db_source.dataset,
        "location": db_source.location,
    }

@router.delete("/{source_id}", status_code=204)
def delete_data_source(
    source_id: str,
    db: Session = Depends(get_db)
):
    """Delete a data source"""
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    db.delete(db_source)
    db.commit()
    
    return None

@router.post("/{source_id}/test-connection")
def test_connection(
    source_id: str,
    db: Session = Depends(get_db)
):
    """Test connection to a data source"""
    logger.info("Starting test_connection for data source", extra={
        "source_id": source_id,
    })

    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        logger.warning("Data source not found during test_connection", extra={
            "source_id": source_id,
        })
        raise HTTPException(status_code=404, detail="Data source not found")
    
    try:
        logger.info("Loaded data source from DB for test_connection", extra={
            "source_id": db_source.id,
            "type": db_source.type.value if hasattr(db_source.type, "value") else str(db_source.type),
            "host": db_source.host,
            "port": db_source.port,
            "database": db_source.database,
            "project_id": getattr(db_source, "project_id", None),
            "dataset": getattr(db_source, "dataset", None),
            "location": getattr(db_source, "location", None),
            "has_password": bool(db_source.password),
        })

        if db_source.type == DataSourceType.bigquery:
            # Test BigQuery connection
            try:
                from google.cloud import bigquery
                from google.oauth2 import service_account
                from google.auth.exceptions import DefaultCredentialsError

                credentials = None

                # Prefer inline service account JSON from the data source if present,
                # otherwise fall back to Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
                if db_source.password:
                    logger.info("BigQuery test_connection using inline service account key", extra={
                        "source_id": db_source.id,
                    })
                    try:
                        service_account_info = json.loads(db_source.password)
                    except json.JSONDecodeError:
                        logger.exception("Failed to parse BigQuery service account JSON during test_connection")
                        raise HTTPException(status_code=400, detail="Invalid service account key JSON")

                    # Create credentials from inline key
                    credentials = service_account.Credentials.from_service_account_info(service_account_info)
                else:
                    logger.info("BigQuery test_connection using default credentials from environment", extra={
                        "source_id": db_source.id,
                        "env_has_google_application_credentials": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
                    })

                # Create BigQuery client (uses provided credentials or ADC from environment)
                logger.info("Creating BigQuery client for test_connection", extra={
                    "source_id": db_source.id,
                    "project": db_source.project_id or db_source.host,
                    "location": db_source.location,
                })

                if credentials is not None:
                    client = bigquery.Client(
                        credentials=credentials,
                        project=db_source.project_id or db_source.host,
                        location=db_source.location
                    )
                else:
                    # Let BigQuery use Application Default Credentials
                    client = bigquery.Client(
                        project=db_source.project_id or db_source.host,
                        location=db_source.location
                    )

                # Test connection by listing datasets
                logger.info("Listing BigQuery datasets for test_connection", extra={
                    "source_id": db_source.id,
                })
                datasets = list(client.list_datasets(max_results=1))

                # Update status to connected
                db_source.status = DataSourceStatus.connected
                db.commit()

                logger.info("BigQuery test_connection successful", extra={
                    "source_id": db_source.id,
                    "datasets_found": len(datasets),
                })
                return {
                    "success": True,
                    "message": "Connection successful",
                    "status": "connected"
                }
            except ImportError:
                logger.exception("google-cloud-bigquery not installed during test_connection")
                raise HTTPException(
                    status_code=500,
                    detail="google-cloud-bigquery library not installed. Install with: pip install google-cloud-bigquery"
                )
            except DefaultCredentialsError as e:
                logger.error("BigQuery test_connection missing default credentials", extra={
                    "source_id": db_source.id,
                    "error": str(e),
                })
                raise HTTPException(
                    status_code=400,
                    detail="Service account credentials not found. Either provide a service account key in the data source or configure GOOGLE_APPLICATION_CREDENTIALS."
                )
            except Exception as e:
                # Update status to error
                db_source.status = DataSourceStatus.error
                db.commit()
                logger.exception("Unexpected error during BigQuery test_connection", extra={
                    "source_id": db_source.id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                return {
                    "success": False,
                    "message": f"Connection failed: {str(e)}",
                    "status": "error"
                }
        
        elif db_source.type == DataSourceType.postgresql:
            # Test PostgreSQL connection
            try:
                import psycopg2
                logger.info("Creating PostgreSQL connection for test_connection", extra={
                    "source_id": db_source.id,
                    "host": db_source.host,
                    "port": db_source.port,
                    "database": db_source.database,
                    "username": db_source.username,
                })
                conn = psycopg2.connect(
                    host=db_source.host,
                    port=db_source.port,
                    database=db_source.database,
                    user=db_source.username,
                    password=db_source.password,
                    connect_timeout=5
                )
                conn.close()
                
                # Update status to connected
                db_source.status = DataSourceStatus.connected
                db.commit()
                
                logger.info("PostgreSQL test_connection successful", extra={
                    "source_id": db_source.id,
                })
                return {
                    "success": True,
                    "message": "Connection successful",
                    "status": "connected"
                }
            except ImportError:
                logger.exception("psycopg2 not installed during test_connection")
                raise HTTPException(
                    status_code=500,
                    detail="psycopg2 library not installed. Install with: pip install psycopg2-binary"
                )
            except Exception as e:
                db_source.status = DataSourceStatus.error
                db.commit()
                logger.exception("Unexpected error during PostgreSQL test_connection", extra={
                    "source_id": db_source.id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                return {
                    "success": False,
                    "message": f"Connection failed: {str(e)}",
                    "status": "error"
                }
        
        elif db_source.type == DataSourceType.mysql:
            # Test MySQL connection
            try:
                import pymysql
                logger.info("Creating MySQL connection for test_connection", extra={
                    "source_id": db_source.id,
                    "host": db_source.host,
                    "port": db_source.port,
                    "database": db_source.database,
                    "username": db_source.username,
                })
                conn = pymysql.connect(
                    host=db_source.host,
                    port=db_source.port,
                    database=db_source.database,
                    user=db_source.username,
                    password=db_source.password,
                    connect_timeout=5
                )
                conn.close()
                
                # Update status to connected
                db_source.status = DataSourceStatus.connected
                db.commit()
                
                logger.info("MySQL test_connection successful", extra={
                    "source_id": db_source.id,
                })
                return {
                    "success": True,
                    "message": "Connection successful",
                    "status": "connected"
                }
            except Exception as e:
                db_source.status = DataSourceStatus.error
                db.commit()
                logger.exception("Unexpected error during MySQL test_connection", extra={
                    "source_id": db_source.id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                })
                return {
                    "success": False,
                    "message": f"Connection failed: {str(e)}",
                    "status": "error"
                }
        
        else:
            # For other types (mongodb, snowflake), return a generic response
            # In production, implement specific connection tests
            logger.info("test_connection not implemented for data source type", extra={
                "source_id": db_source.id,
                "type": db_source.type.value if hasattr(db_source.type, "value") else str(db_source.type),
            })
            return {
                "success": False,
                "message": f"Connection testing not yet implemented for {db_source.type.value}",
                "status": "disconnected"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        db_source.status = DataSourceStatus.error
        db.commit()
        logger.exception("Top-level unexpected error during test_connection", extra={
            "source_id": db_source.id if 'db_source' in locals() and db_source else source_id,
            "error": str(e),
            "error_type": type(e).__name__,
        })
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}",
            "status": "error"
        }
