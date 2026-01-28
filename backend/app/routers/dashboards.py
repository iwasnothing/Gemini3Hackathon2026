from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import Dashboard, DataCube
from ..schemas import DashboardCreate, DashboardResponse, AIChatMessage, AIChatResponse
from datetime import datetime
import uuid
import json
import random

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=list[DashboardResponse])
def get_dashboards(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all dashboards (filtered by entitlements in production)"""
    dashboards = db.query(Dashboard).all()
    
    # TODO: Filter by entitlements based on user_id
    # For now, return all dashboards
    
    result = []
    for dashboard in dashboards:
        result.append({
            "id": dashboard.id,
            "name": dashboard.name,
            "description": dashboard.description,
            "dataCubeId": dashboard.data_cube_id,
            "widgets": dashboard.widgets_json or [],
            "createdAt": dashboard.created_at.isoformat() if dashboard.created_at else datetime.now().isoformat(),
            "updatedAt": dashboard.updated_at.isoformat() if dashboard.updated_at else datetime.now().isoformat()
        })
    
    return result

@router.post("", response_model=DashboardResponse, status_code=201)
def create_dashboard(
    dashboard: DashboardCreate,
    db: Session = Depends(get_db)
):
    """Create a new dashboard"""
    # Verify data cube exists
    db_cube = db.query(DataCube).filter(DataCube.id == dashboard.data_cube_id).first()
    if not db_cube:
        raise HTTPException(status_code=404, detail="Data cube not found")
    
    dashboard_id = f"dashboard-{uuid.uuid4().hex[:12]}"
    
    widgets_list = [widget.model_dump() for widget in dashboard.widgets]
    
    db_dashboard = Dashboard(
        id=dashboard_id,
        name=dashboard.name,
        description=dashboard.description,
        data_cube_id=dashboard.data_cube_id,
        widgets_json=widgets_list
    )
    
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    
    return {
        "id": db_dashboard.id,
        "name": db_dashboard.name,
        "description": db_dashboard.description,
        "dataCubeId": db_dashboard.data_cube_id,
        "widgets": db_dashboard.widgets_json or [],
        "createdAt": db_dashboard.created_at.isoformat() if db_dashboard.created_at else datetime.now().isoformat(),
        "updatedAt": db_dashboard.updated_at.isoformat() if db_dashboard.updated_at else datetime.now().isoformat()
    }

@router.get("/{dashboard_id}", response_model=DashboardResponse)
def get_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific dashboard"""
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "description": dashboard.description,
        "dataCubeId": dashboard.data_cube_id,
        "widgets": dashboard.widgets_json or [],
        "createdAt": dashboard.created_at.isoformat() if dashboard.created_at else datetime.now().isoformat(),
        "updatedAt": dashboard.updated_at.isoformat() if dashboard.updated_at else datetime.now().isoformat()
    }

@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: str,
    dashboard: DashboardCreate,
    db: Session = Depends(get_db)
):
    """Update a dashboard"""
    db_dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not db_dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    widgets_list = [widget.model_dump() for widget in dashboard.widgets]
    
    db_dashboard.name = dashboard.name
    db_dashboard.description = dashboard.description
    db_dashboard.data_cube_id = dashboard.data_cube_id
    db_dashboard.widgets_json = widgets_list
    
    db.commit()
    db.refresh(db_dashboard)
    
    return {
        "id": db_dashboard.id,
        "name": db_dashboard.name,
        "description": db_dashboard.description,
        "dataCubeId": db_dashboard.data_cube_id,
        "widgets": db_dashboard.widgets_json or [],
        "createdAt": db_dashboard.created_at.isoformat() if db_dashboard.created_at else datetime.now().isoformat(),
        "updatedAt": db_dashboard.updated_at.isoformat() if db_dashboard.updated_at else datetime.now().isoformat()
    }

@router.delete("/{dashboard_id}", status_code=204)
def delete_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    """Delete a dashboard"""
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    db.delete(dashboard)
    db.commit()
    
    return None

@router.post("/{dashboard_id}/ai-chat", response_model=AIChatResponse)
def ai_chat(
    dashboard_id: str,
    message: AIChatMessage,
    db: Session = Depends(get_db)
):
    """Send message to AI assistant for a dashboard"""
    # Verify dashboard exists
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Mock AI response
    responses = [
        f"Based on the dashboard '{dashboard.name}' data, I can see that sales have been trending upward. The total sales for Q1 2024 is $405,000.",
        f"The data shows that sales peaked in February 2024 with $142,000 in revenue.",
        f"Looking at the metrics for '{dashboard.name}', the average order value is approximately $328.",
    ]
    
    response = random.choice(responses)
    
    return {
        "response": response,
        "timestamp": datetime.now().isoformat()
    }
