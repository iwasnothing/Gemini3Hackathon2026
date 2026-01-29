from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional
from ..database import get_db
from ..models import DataCube, DataSource, Table, DataSourceType
from ..schemas import (
    DataCubeCreate, DataCubeUpdate, DataCubeResponse, DataCubeQuery, DataCubeQueryResponse,
    DataCubeGenerateRequest, DataCubeGenerateResponse, TableSchema, ColumnSchema,
    DataCubePreviewRequest, SqlPreviewResponse,
)
from datetime import datetime
import uuid
import json
import os
import logging
from genai.data_cube_prompt import generate_data_cube

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data-cubes", tags=["data-cubes"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=list[DataCubeResponse])
def get_data_cubes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all data cubes from MySQL database (filtered by entitlements in production)"""
    logger.info("Querying data cubes from MySQL", extra={"user_id": user_id})
    
    # Query MySQL database for all data cubes
    # Use expire_all to ensure fresh query from database
    db.expire_all()
    data_cubes = db.query(DataCube).order_by(DataCube.created_at.desc()).all()
    
    logger.info("Found data cubes in MySQL", extra={
        "cube_count": len(data_cubes),
        "user_id": user_id
    })
    
    # TODO: Filter by entitlements based on user_id
    # For now, return all data cubes
    
    result = []
    for cube in data_cubes:
        # Return dict with camelCase to match frontend expectations and data marketplace format
        result.append({
            "id": cube.id,
            "name": cube.name,
            "description": cube.description or "",  # Ensure description is never None
            "query": cube.query,
            "dataSourceId": cube.data_source_id,  # camelCase to match frontend
            "dimensions": cube.dimensions_json or [],
            "measures": cube.measures_json or [],
            "metadata": cube.metadata_json or {},
            "createdAt": cube.created_at.isoformat() if cube.created_at else datetime.now().isoformat(),
            "data": []
        })
    
    logger.info("Returning data cubes to frontend", extra={
        "cube_count": len(result),
        "cube_ids": [c["id"] for c in result]
    })
    
    return result

@router.post("", response_model=DataCubeResponse, status_code=201)
def create_data_cube(
    data_cube: DataCubeCreate,
    db: Session = Depends(get_db)
):
    """Create a new data cube and persist it to the database"""
    logger.info("Creating data cube", extra={
        "cube_name": data_cube.name,
        "data_source_id": data_cube.data_source_id
    })
    
    # Verify data source exists
    db_source = db.query(DataSource).filter(DataSource.id == data_cube.data_source_id).first()
    if not db_source:
        logger.warning("Data source not found", extra={"data_source_id": data_cube.data_source_id})
        raise HTTPException(status_code=404, detail="Data source not found")
    
    cube_id = f"cube-{uuid.uuid4().hex[:12]}"
    
    # Create and persist the data cube to MySQL database via SQLAlchemy
    db_cube = DataCube(
        id=cube_id,
        name=data_cube.name,
        description=data_cube.description,
        query=data_cube.query,
        data_source_id=data_cube.data_source_id,
        dimensions_json=data_cube.dimensions,
        measures_json=data_cube.measures,
        metadata_json=data_cube.metadata
    )
    
    try:
        db.add(db_cube)
        db.flush()  # Flush to ensure the object is in the session
        db.commit()  # Commit the transaction to MySQL
        db.refresh(db_cube)  # Refresh to get database-generated fields
        
        # Verify the data cube was actually persisted by querying it back
        # Expire the object to force a fresh query from database
        db.expire(db_cube)
        
        # Query again to verify it's in the database
        verification = db.query(DataCube).filter(DataCube.id == cube_id).first()
        if not verification:
            logger.error("Data cube was not found in database after commit", extra={
                "cube_id": cube_id
            })
            raise HTTPException(
                status_code=500,
                detail="Data cube was created but could not be verified in database"
            )
        
        # Also verify total count to ensure data is visible
        total_cubes = db.query(DataCube).count()
        logger.info("Data cube persisted and verified successfully", extra={
            "cube_id": db_cube.id,
            "cube_name": db_cube.name,
            "data_source_id": db_cube.data_source_id,
            "verified": True,
            "total_cubes_in_db": total_cubes
        })
        
        # Double-check: query all cubes to ensure this one is included
        all_cubes = db.query(DataCube).all()
        cube_found_in_all = any(c.id == cube_id for c in all_cubes)
        if not cube_found_in_all:
            logger.error("Data cube not found in all cubes query", extra={
                "cube_id": cube_id,
                "total_cubes": len(all_cubes)
            })
        else:
            logger.info("Data cube confirmed in all cubes query", extra={
                "cube_id": cube_id,
                "total_cubes": len(all_cubes)
            })
        
        # Final verification: Use raw SQL to ensure data is actually in MySQL
        try:
            result = db.execute(text("SELECT COUNT(*) as count FROM data_cubes WHERE id = :cube_id"), {"cube_id": cube_id})
            count = result.scalar()
            if count == 0:
                logger.error("Data cube not found in MySQL using raw SQL query", extra={"cube_id": cube_id})
            else:
                logger.info("Data cube verified in MySQL using raw SQL", extra={
                    "cube_id": cube_id,
                    "sql_count": count
                })
        except Exception as e:
            logger.warning("Could not verify with raw SQL", extra={"error": str(e)})
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to persist data cube to database", extra={
            "cube_id": cube_id,
            "error": str(e),
            "error_type": type(e).__name__
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save data cube to database: {str(e)}"
        )
    
    # Return dict with camelCase to match frontend expectations and data marketplace format
    return {
        "id": db_cube.id,
        "name": db_cube.name,
        "description": db_cube.description,
        "query": db_cube.query,
        "dataSourceId": db_cube.data_source_id,  # camelCase to match frontend
        "dimensions": db_cube.dimensions_json or [],
        "measures": db_cube.measures_json or [],
        "metadata": db_cube.metadata_json or {},
        "createdAt": db_cube.created_at.isoformat() if db_cube.created_at else datetime.now().isoformat(),
        "data": []
    }

@router.put("/{cube_id}", response_model=DataCubeResponse)
def update_data_cube(
    cube_id: str,
    data_cube: DataCubeUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing data cube."""
    logger.info("Updating data cube", extra={"cube_id": cube_id})

    db_cube = db.query(DataCube).filter(DataCube.id == cube_id).first()
    if not db_cube:
        logger.warning("Data cube not found for update", extra={"cube_id": cube_id})
        raise HTTPException(status_code=404, detail="Data cube not found")

    # Update fields
    db_cube.name = data_cube.name
    db_cube.description = data_cube.description
    db_cube.query = data_cube.query
    db_cube.data_source_id = data_cube.data_source_id
    db_cube.dimensions_json = data_cube.dimensions
    db_cube.measures_json = data_cube.measures
    db_cube.metadata_json = data_cube.metadata

    try:
        db.commit()
        db.refresh(db_cube)
        logger.info("Data cube updated successfully", extra={"cube_id": cube_id})
    except Exception as e:
        db.rollback()
        logger.exception("Failed to update data cube", extra={"cube_id": cube_id, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to update data cube: {str(e)}")

    return {
        "id": db_cube.id,
        "name": db_cube.name,
        "description": db_cube.description or "",
        "query": db_cube.query,
        "dataSourceId": db_cube.data_source_id,
        "dimensions": db_cube.dimensions_json or [],
        "measures": db_cube.measures_json or [],
        "metadata": db_cube.metadata_json or {},
        "createdAt": db_cube.created_at.isoformat() if db_cube.created_at else datetime.now().isoformat(),
        "data": []
    }

@router.delete("/{cube_id}", status_code=204)
def delete_data_cube(
    cube_id: str,
    db: Session = Depends(get_db)
):
    """Delete a data cube."""
    logger.info("Deleting data cube", extra={"cube_id": cube_id})

    db_cube = db.query(DataCube).filter(DataCube.id == cube_id).first()
    if not db_cube:
        logger.warning("Data cube not found for delete", extra={"cube_id": cube_id})
        raise HTTPException(status_code=404, detail="Data cube not found")

    try:
        db.delete(db_cube)
        db.commit()
        logger.info("Data cube deleted successfully", extra={"cube_id": cube_id})
    except Exception as e:
        db.rollback()
        logger.exception("Failed to delete data cube", extra={"cube_id": cube_id, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to delete data cube: {str(e)}")


@router.post("/{cube_id}/preview", response_model=SqlPreviewResponse)
def preview_data_cube(
    cube_id: str,
    request: DataCubePreviewRequest,
    db: Session = Depends(get_db),
):
    """Execute the data cube's SQL against its data source and return a paginated result set."""
    db_cube = db.query(DataCube).filter(DataCube.id == cube_id).first()
    if not db_cube:
        raise HTTPException(status_code=404, detail="Data cube not found")

    db_source = db.query(DataSource).filter(DataSource.id == db_cube.data_source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found for this cube")

    if db_source.type != DataSourceType.bigquery:
        raise HTTPException(
            status_code=400,
            detail="Cube preview is currently only supported for BigQuery data sources.",
        )

    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        from google.auth.exceptions import DefaultCredentialsError
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="google-cloud-bigquery library not installed.",
        )

    limit = max(1, min(request.limit, 500))
    offset = max(0, request.offset)

    # Wrap cube query in subquery so we can apply LIMIT/OFFSET for pagination
    inner_sql = db_cube.query.strip()
    if inner_sql.rstrip().endswith(";"):
        inner_sql = inner_sql.rstrip()[:-1]
    sql = f"SELECT * FROM (\n{inner_sql}\n) AS _preview\nLIMIT {limit} OFFSET {offset}"

    try:
        credentials = None
        if db_source.password:
            try:
                service_account_info = json.loads(db_source.password)
                credentials = service_account.Credentials.from_service_account_info(service_account_info)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid service account key JSON")
        project = db_source.project_id or db_source.host
        if credentials:
            client = bigquery.Client(
                credentials=credentials,
                project=project,
                location=db_source.location,
            )
        else:
            client = bigquery.Client(project=project, location=db_source.location)

        query_job = client.query(sql)
        rows_iter = query_job.result(max_results=limit)
        rows = list(rows_iter)

        if not rows:
            return SqlPreviewResponse(rows=[], columns=[])

        columns = list(rows[0].keys())
        data_rows = [dict(row) for row in rows]
        return SqlPreviewResponse(rows=data_rows, columns=columns)
    except DefaultCredentialsError:
        raise HTTPException(
            status_code=400,
            detail="Service account credentials not found. Configure GOOGLE_APPLICATION_CREDENTIALS or add a key to the data source.",
        )
    except Exception as e:
        logger.exception("preview_data_cube failed", extra={"cube_id": cube_id, "error": str(e)})
        raise HTTPException(status_code=400, detail=f"Failed to execute cube preview: {str(e)}")


@router.post("/generate", response_model=DataCubeGenerateResponse)
def generate_data_cube_ai(
    request: DataCubeGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate a data cube structure from natural language using AI/LLM"""
    logger.info("generate_data_cube_ai called", extra={
        "data_source_id": request.data_source_id,
        "user_request_length": len(request.user_request)
    })
    
    # Verify data source exists
    db_source = db.query(DataSource).filter(DataSource.id == request.data_source_id).first()
    if not db_source:
        logger.warning("Data source not found", extra={"data_source_id": request.data_source_id})
        raise HTTPException(status_code=404, detail="Data source not found")
    
    # Get schema directly from data source (includes both tables and views)
    # For BigQuery, this fetches live schema including views
    # For other sources, this uses cached schema
    available_tables = []
    
    # For BigQuery, fetch schema directly (includes views)
    if db_source.type == DataSourceType.bigquery:
        try:
            from google.cloud import bigquery
            from google.oauth2 import service_account
            from google.auth.exceptions import DefaultCredentialsError
            import json as json_lib
            import os
            
            if not db_source.dataset:
                raise HTTPException(
                    status_code=400,
                    detail="BigQuery dataset is not configured for this data source"
                )
            
            project = db_source.project_id or db_source.host
            dataset_name = db_source.dataset
            
            # Get credentials
            credentials = None
            if db_source.password:
                try:
                    service_account_info = json_lib.loads(db_source.password)
                    credentials = service_account.Credentials.from_service_account_info(service_account_info)
                except json_lib.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid service account key JSON")
            
            # Create BigQuery client
            if credentials:
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
            
            # Query INFORMATION_SCHEMA.COLUMNS to get both tables and views
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
            
            logger.info("Querying BigQuery INFORMATION_SCHEMA for tables and views", extra={
                "data_source_id": request.data_source_id,
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
                        "row_count": 0,
                        "description": None,
                    }
                
                tables_map[table_name]["columns"].append({
                    "name": column_name,
                    "type": data_type,
                    "primary_key": False,
                    "description": None
                })
            
            available_tables = list(tables_map.values())
            logger.info("Fetched BigQuery schema", extra={
                "data_source_id": request.data_source_id,
                "table_count": len(available_tables)
            })
            
        except Exception as e:
            logger.exception("Error fetching BigQuery schema", extra={
                "data_source_id": request.data_source_id,
                "error": str(e)
            })
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch BigQuery schema: {str(e)}"
            )
    else:
        # For other data sources, use cached schema from database
        tables = db.query(Table).filter(Table.data_source_id == request.data_source_id).all()
        logger.info("Found cached tables for data source", extra={
            "data_source_id": request.data_source_id,
            "table_count": len(tables)
        })
        
        for table in tables:
            columns_data = table.columns_json or []
            columns = []
            for col in columns_data:
                columns.append({
                    "name": col.get("name", ""),
                    "type": col.get("type", ""),
                    "primary_key": col.get("primary_key", False),
                    "description": col.get("description", "")
                })
            
            available_tables.append({
                "name": table.name,
                "schema": table.schema_name,
                "columns": columns,
                "row_count": table.row_count or 0
            })
    
    if not available_tables:
        logger.warning("No tables or views found for data source", extra={"data_source_id": request.data_source_id})
        raise HTTPException(
            status_code=400,
            detail="No tables or views found for this data source. Please sync the schema first or ensure the dataset has tables/views."
        )
    
    # Prepare data source info
    data_source_info = {
        "name": db_source.name,
        "type": db_source.type.value,
        "database": db_source.database or db_source.dataset or "",
        "host": db_source.host,
        "port": db_source.port
    }
    
    try:
        logger.info("Calling generate_data_cube with LLM")
        # Generate data cube using LLM (no persistence here)
        generated_cube = generate_data_cube(
            user_request=request.user_request,
            data_source_info=data_source_info,
            available_tables=available_tables
        )
        
        logger.info("Successfully generated data cube", extra={
            "cube_name": generated_cube.name,
            "dimensions_count": len(generated_cube.dimensions),
            "measures_count": len(generated_cube.measures)
        })
        
        # Return only the generated structure; persistence is handled separately
        return {
            "name": generated_cube.name,
            "description": generated_cube.description,
            "query": generated_cube.query,
            "dimensions": generated_cube.dimensions,
            "measures": generated_cube.measures,
            "metadata": generated_cube.metadata or {},
        }
    except ValueError as e:
        logger.error("ValueError in generate_data_cube", extra={"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in generate_data_cube_ai", extra={
            "error": str(e),
            "error_type": type(e).__name__
        })
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate data cube: {str(e)}"
        )

@router.post("/query", response_model=DataCubeQueryResponse)
def query_data_cube(
    query_request: DataCubeQuery,
    db: Session = Depends(get_db)
):
    """Query data cubes from MySQL database and return results"""
    logger.info("Querying data cubes from MySQL", extra={
        "query": query_request.query
    })
    
    # Query MySQL database for data cubes matching the query
    # For now, we'll search by name or description
    # In production, this could use full-text search or AI/LLM to convert
    # natural language to SQL queries
    
    db.expire_all()
    
    # Search for data cubes matching the query string
    # MySQL uses LIKE (case-insensitive by default) or we can use LOWER() for explicit case-insensitive search
    search_term = f"%{query_request.query}%"
    data_cubes = db.query(DataCube).filter(
        (func.lower(DataCube.name).like(func.lower(search_term))) |
        (func.lower(DataCube.description).like(func.lower(search_term)))
    ).order_by(DataCube.created_at.desc()).all()
    
    logger.info("Found matching data cubes", extra={
        "cube_count": len(data_cubes),
        "search_term": query_request.query
    })
    
    # Convert to response format
    result_data = []
    columns = ["id", "name", "description", "query", "dataSourceId", "dimensions", "measures", "metadata", "createdAt"]
    
    for cube in data_cubes:
        result_data.append({
            "id": cube.id,
            "name": cube.name,
            "description": cube.description or "",
            "query": cube.query,
            "dataSourceId": cube.data_source_id,
            "dimensions": cube.dimensions_json or [],
            "measures": cube.measures_json or [],
            "metadata": cube.metadata_json or {},
            "createdAt": cube.created_at.isoformat() if cube.created_at else datetime.now().isoformat()
        })
    
    logger.info("Returning query results to frontend", extra={
        "result_count": len(result_data)
    })
    
    return {
        "data": result_data,
        "columns": columns
    }
