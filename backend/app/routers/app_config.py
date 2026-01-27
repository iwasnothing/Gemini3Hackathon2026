from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AppConfig
from ..schemas import AppConfigCreate, AppConfigResponse
import uuid

router = APIRouter(prefix="/api/app-config", tags=["app-config"])

@router.get("", response_model=list[AppConfigResponse])
def get_app_configs(db: Session = Depends(get_db)):
    """Get all application configs"""
    configs = db.query(AppConfig).all()
    return configs

@router.get("/{key}", response_model=AppConfigResponse)
def get_app_config(key: str, db: Session = Depends(get_db)):
    """Get a specific application config by key"""
    config = db.query(AppConfig).filter(AppConfig.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.post("", response_model=AppConfigResponse, status_code=201)
def create_app_config(config: AppConfigCreate, db: Session = Depends(get_db)):
    """Create a new application config"""
    # Check if key already exists
    existing = db.query(AppConfig).filter(AppConfig.key == config.key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Config key already exists")
    
    config_id = f"config-{uuid.uuid4().hex[:12]}"
    
    db_config = AppConfig(
        id=config_id,
        key=config.key,
        value=config.value,
        description=config.description
    )
    
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config

@router.put("/{key}", response_model=AppConfigResponse)
def update_app_config(key: str, config: AppConfigCreate, db: Session = Depends(get_db)):
    """Update an application config"""
    db_config = db.query(AppConfig).filter(AppConfig.key == key).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    db_config.value = config.value
    db_config.description = config.description
    
    db.commit()
    db.refresh(db_config)
    
    return db_config

@router.delete("/{key}", status_code=204)
def delete_app_config(key: str, db: Session = Depends(get_db)):
    """Delete an application config"""
    config = db.query(AppConfig).filter(AppConfig.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    db.delete(config)
    db.commit()
    
    return None
