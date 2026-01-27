from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import DataEntitlement, DataSource, DataCube, Dashboard
from ..schemas import DataEntitlementCreate, EntitledResource
from datetime import datetime

router = APIRouter(prefix="/api/data-entitlement", tags=["data-entitlement"])

def get_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """Extract user ID from header or use default"""
    return x_user_id or "user-1"

@router.get("", response_model=list[EntitledResource])
def get_entitlements(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Get all entitlements for the current user"""
    entitlements = db.query(DataEntitlement).filter(DataEntitlement.user_id == user_id).all()
    
    entitled_resources = []
    
    for ent in entitlements:
        resource_name = "Unknown Resource"
        
        if ent.resource_type == "dataSource":
            resource = db.query(DataSource).filter(DataSource.id == ent.resource_id).first()
            resource_name = resource.name if resource else f"Data Source {ent.resource_id}"
        elif ent.resource_type == "dataCube":
            resource = db.query(DataCube).filter(DataCube.id == ent.resource_id).first()
            resource_name = resource.name if resource else f"Data Cube {ent.resource_id}"
        elif ent.resource_type == "dashboard":
            resource = db.query(Dashboard).filter(Dashboard.id == ent.resource_id).first()
            resource_name = resource.name if resource else f"Dashboard {ent.resource_id}"
        
        entitled_resources.append({
            "resourceType": ent.resource_type,
            "resourceId": ent.resource_id,
            "resourceName": resource_name,
            "permissions": ent.permissions_json or [],
            "grantedAt": ent.granted_at.isoformat() if ent.granted_at else datetime.now().isoformat()
        })
    
    return entitled_resources

@router.post("", response_model=dict, status_code=201)
def create_entitlement(
    entitlement: DataEntitlementCreate,
    db: Session = Depends(get_db)
):
    """Create a new data entitlement"""
    import uuid
    
    entitlement_id = f"ent-{uuid.uuid4().hex[:12]}"
    
    db_entitlement = DataEntitlement(
        id=entitlement_id,
        user_id=entitlement.user_id,
        resource_type=entitlement.resource_type,
        resource_id=entitlement.resource_id,
        permissions_json=[p.value for p in entitlement.permissions],
        granted_by=entitlement.granted_by
    )
    
    db.add(db_entitlement)
    db.commit()
    db.refresh(db_entitlement)
    
    return {
        "id": db_entitlement.id,
        "userId": db_entitlement.user_id,
        "resourceType": db_entitlement.resource_type,
        "resourceId": db_entitlement.resource_id,
        "permissions": db_entitlement.permissions_json,
        "grantedAt": db_entitlement.granted_at.isoformat() if db_entitlement.granted_at else datetime.now().isoformat(),
        "grantedBy": db_entitlement.granted_by
    }

@router.delete("/{entitlement_id}", status_code=204)
def delete_entitlement(
    entitlement_id: str,
    db: Session = Depends(get_db)
):
    """Delete a data entitlement"""
    entitlement = db.query(DataEntitlement).filter(DataEntitlement.id == entitlement_id).first()
    if not entitlement:
        raise HTTPException(status_code=404, detail="Entitlement not found")
    
    db.delete(entitlement)
    db.commit()
    
    return None
