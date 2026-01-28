from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataSource, DataCube, Dashboard, Table
from ..schemas import DataMarketplaceResponse, DataSourceResponse, DataCubeResponse, DashboardResponse, TableSchema, ColumnSchema
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data-marketplace", tags=["data-marketplace"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=DataMarketplaceResponse)
def get_marketplace(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all resources for the data marketplace (filtered by entitlements)"""
    logger.info("=" * 50)
    logger.info("BACKEND: GET /api/data-marketplace endpoint called", extra={"user_id": user_id})
    logger.info("=" * 50)
    
    # Get all data sources with their tables
    data_sources = db.query(DataSource).all()
    data_sources_list = []
    
    for source in data_sources:
        tables = db.query(Table).filter(Table.data_source_id == source.id).all()
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
            ).dict(by_alias=True))
        
        source_dict = {
            "id": source.id,
            "name": source.name,
            "type": source.type,
            "host": source.host,
            "port": source.port,
            "database": source.database,
            "username": source.username,
            "status": source.status,
            "last_sync": source.last_sync.isoformat() if source.last_sync else None,
            "project_id": source.project_id,
            "dataset": source.dataset,
            "location": source.location,
            "tables": tables_list
        }
        data_sources_list.append(source_dict)
    
    # Get all data cubes from MySQL database
    # Use explicit query to ensure we're reading committed data
    # Expire any cached objects to force fresh query
    try:
        # Ensure we're reading from the database, not session cache
        db.expire_all()
        
        # Query all data cubes ordered by creation date
        data_cubes = db.query(DataCube).order_by(DataCube.created_at.desc()).all()
        
        logger.info("Querying data cubes from database", extra={
            "cube_count": len(data_cubes),
            "user_id": user_id
        })
        
        # Log cube IDs for debugging
        if data_cubes:
            cube_ids = [cube.id for cube in data_cubes]
            cube_names = [cube.name for cube in data_cubes]
            logger.info("Found data cubes in database", extra={
                "cube_ids": cube_ids,
                "cube_names": cube_names
            })
        else:
            logger.warning("No data cubes found in database", extra={
                "user_id": user_id
            })
    except Exception as e:
        logger.exception("Error querying data cubes from database", extra={
            "error": str(e),
            "error_type": type(e).__name__
        })
        data_cubes = []
    
    data_cubes_list = []
    for cube in data_cubes:
        data_cubes_list.append({
            "id": cube.id,
            "name": cube.name,
            "description": cube.description or "",  # Ensure description is never None
            "query": cube.query,
            "dataSourceId": cube.data_source_id,
            "dimensions": cube.dimensions_json or [],
            "measures": cube.measures_json or [],
            "metadata": cube.metadata_json or {},
            "createdAt": cube.created_at.isoformat() if cube.created_at else datetime.now().isoformat(),
            "data": []
        })
    
    logger.info("Returning data cubes to frontend", extra={
        "cube_count": len(data_cubes_list),
        "cube_ids": [c["id"] for c in data_cubes_list]
    })
    
    # Get all dashboards
    dashboards = db.query(Dashboard).all()
    dashboards_list = []
    for dashboard in dashboards:
        dashboards_list.append({
            "id": dashboard.id,
            "name": dashboard.name,
            "description": dashboard.description,
            "dataCubeId": dashboard.data_cube_id,
            "widgets": dashboard.widgets_json or [],
            "createdAt": dashboard.created_at.isoformat() if dashboard.created_at else datetime.now().isoformat(),
            "updatedAt": dashboard.updated_at.isoformat() if dashboard.updated_at else datetime.now().isoformat()
        })
    
    # TODO: Filter by entitlements based on user_id
    # For now, return all resources
    
    logger.info("Marketplace data prepared", extra={
        "data_sources_count": len(data_sources_list),
        "data_cubes_count": len(data_cubes_list),
        "dashboards_count": len(dashboards_list)
    })
    
    return {
        "dataSources": data_sources_list,
        "dataCubes": data_cubes_list,
        "dashboards": dashboards_list
    }
