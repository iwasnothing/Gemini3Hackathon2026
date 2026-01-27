from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataCube, DataSource
from ..schemas import DataCubeCreate, DataCubeResponse, DataCubeQuery, DataCubeQueryResponse
from datetime import datetime
import uuid
import json

router = APIRouter(prefix="/api/data-cubes", tags=["data-cubes"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=list[DataCubeResponse])
def get_data_cubes(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all data cubes (filtered by entitlements in production)"""
    data_cubes = db.query(DataCube).all()
    
    # TODO: Filter by entitlements based on user_id
    # For now, return all data cubes
    
    result = []
    for cube in data_cubes:
        result.append({
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
    
    return result

@router.post("", response_model=DataCubeResponse, status_code=201)
def create_data_cube(
    data_cube: DataCubeCreate,
    db: Session = Depends(get_db)
):
    """Create a new data cube"""
    # Verify data source exists
    db_source = db.query(DataSource).filter(DataSource.id == data_cube.data_source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    cube_id = f"cube-{uuid.uuid4().hex[:12]}"
    
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
    
    db.add(db_cube)
    db.commit()
    db.refresh(db_cube)
    
    return {
        "id": db_cube.id,
        "name": db_cube.name,
        "description": db_cube.description,
        "query": db_cube.query,
        "dataSourceId": db_cube.data_source_id,
        "dimensions": db_cube.dimensions_json or [],
        "measures": db_cube.measures_json or [],
        "metadata": db_cube.metadata_json or {},
        "createdAt": db_cube.created_at.isoformat() if db_cube.created_at else datetime.now().isoformat(),
        "data": []
    }

@router.post("/query", response_model=DataCubeQueryResponse)
def query_data_cube(
    query: DataCubeQuery,
    db: Session = Depends(get_db)
):
    """Execute a natural language query on data cubes"""
    # This is a placeholder - in production, this would use AI/LLM to convert
    # natural language to SQL and execute it
    
    # Mock response for now
    return {
        "data": [
            {"column1": "value1", "column2": "value2"},
            {"column1": "value3", "column2": "value4"}
        ],
        "columns": ["column1", "column2"]
    }
