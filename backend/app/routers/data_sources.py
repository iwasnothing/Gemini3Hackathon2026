from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataSource, Table, DataSourceType, DataSourceStatus
from ..schemas import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceUpdate,
    TableSchema,
    ColumnSchema,
    SqlPreviewRequest,
    SqlPreviewResponse,
)
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
    """
    Lightweight placeholder connection test.
    It only verifies that the data source exists and returns a synthetic success response.
    """
    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    logger.info("test_connection called (placeholder)", extra={
        "source_id": source_id,
        "type": db_source.type.value if hasattr(db_source.type, "value") else str(db_source.type),
    })

    return {
        "success": True,
        "message": "Connection test placeholder succeeded (no live DB call).",
        "status": "connected",
    }

@router.post("/{source_id}/preview-sql", response_model=SqlPreviewResponse)
def preview_sql(
    source_id: str,
    request: SqlPreviewRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a SQL query against the given data source and return a small preview.
    Currently supports BigQuery data sources.
    """
    logger.info("Starting preview_sql for data source", extra={
        "source_id": source_id,
        "max_rows": request.max_rows,
    })

    db_source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not db_source:
        logger.warning("Data source not found during preview_sql", extra={"source_id": source_id})
        raise HTTPException(status_code=404, detail="Data source not found")

    if db_source.type != DataSourceType.bigquery:
        logger.warning("preview_sql not implemented for this data source type", extra={
            "source_id": source_id,
            "type": db_source.type.value if hasattr(db_source.type, "value") else str(db_source.type),
        })
        raise HTTPException(
            status_code=400,
            detail="SQL preview is currently only supported for BigQuery data sources."
        )

    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        from google.auth.exceptions import DefaultCredentialsError
    except ImportError:
        logger.exception("google-cloud-bigquery not installed during preview_sql")
        raise HTTPException(
            status_code=500,
            detail="google-cloud-bigquery library not installed. Install with: pip install google-cloud-bigquery"
        )

    try:
        credentials = None

        # Prefer inline service account JSON from the data source if present,
        # otherwise fall back to Application Default Credentials
        if db_source.password:
            logger.info("preview_sql using inline service account key", extra={"source_id": db_source.id})
            try:
                service_account_info = json.loads(db_source.password)
            except json.JSONDecodeError:
                logger.exception("Failed to parse BigQuery service account JSON during preview_sql")
                raise HTTPException(status_code=400, detail="Invalid service account key JSON")

            credentials = service_account.Credentials.from_service_account_info(service_account_info)
        else:
            logger.info("preview_sql using default credentials from environment", extra={
                "source_id": db_source.id,
                "env_has_google_application_credentials": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
            })

        # Create BigQuery client
        project = db_source.project_id or db_source.host
        logger.info("Creating BigQuery client for preview_sql", extra={
            "source_id": db_source.id,
            "project": project,
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

        # Apply LIMIT if not already present, to avoid huge result sets
        sql = request.sql.strip()
        if "limit" not in sql.lower():
            sql = f"{sql}\nLIMIT {request.max_rows}"

        logger.info("Executing preview_sql query", extra={
            "source_id": source_id,
            "sql_snippet": sql[:200],
        })

        query_job = client.query(sql)
        rows_iter = query_job.result(max_results=request.max_rows)
        rows = list(rows_iter)

        if not rows:
            return SqlPreviewResponse(rows=[], columns=[])

        # Convert rows to plain dicts
        sample_row = rows[0]
        columns = list(sample_row.keys())
        data_rows = [dict(row) for row in rows]

        logger.info("preview_sql query succeeded", extra={
            "source_id": source_id,
            "row_count": len(data_rows),
            "column_count": len(columns),
        })

        return SqlPreviewResponse(rows=data_rows, columns=columns)
    except DefaultCredentialsError as e:
        logger.error("preview_sql missing default credentials", extra={
            "source_id": source_id,
            "error": str(e),
        })
        raise HTTPException(
            status_code=400,
            detail="Service account credentials not found. Either provide a service account key in the data source or configure GOOGLE_APPLICATION_CREDENTIALS."
        )
    except Exception as e:
        logger.exception("Unexpected error during preview_sql", extra={
            "source_id": source_id,
            "error": str(e),
            "error_type": type(e).__name__,
        })
        raise HTTPException(
            status_code=400,
            detail=f"Failed to execute SQL preview: {str(e)}"
        )
