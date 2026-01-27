from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataSource, DataCube, Dashboard, Table
from ..schemas import DataMarketplaceResponse, DataSourceResponse, DataCubeResponse, DashboardResponse, TableSchema, ColumnSchema
from datetime import datetime

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
            ).dict())
        
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
    
    # Get all data cubes
    data_cubes = db.query(DataCube).all()
    data_cubes_list = []
    for cube in data_cubes:
        data_cubes_list.append({
            "id": cube.id,
            "name": cube.name,
            "description": cube.description,
            "query": cube.query,
            "dataSourceId": cube.data_source_id,
            "dimensions": cube.dimensions_json or [],
            "measures": cube.measures_json or [],
            "metadata": cube.metadata_json or {},
            "createdAt": cube.created_at.isoformat() if cube.created_at else datetime.now().isoformat(),
            "data": []
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
    
    return {
        "dataSources": data_sources_list,
        "dataCubes": data_cubes_list,
        "dashboards": dashboards_list
    }
