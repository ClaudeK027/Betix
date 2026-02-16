from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.services.ingestion.base_client import SupabaseREST
from app.config import get_settings

router = APIRouter(prefix="/system", tags=["System"])

class SystemConfigItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[str] = None

class SystemConfigUpdate(BaseModel):
    value: str

@router.get("/config", response_model=List[SystemConfigItem])
def get_system_config():
    """Fetch all system configuration."""
    settings = get_settings()
    # Using Service Role to ensure we can read everything
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema='public')
    
    rows = db.select('system_config')
    if not rows:
        return []
    return rows

@router.patch("/config/{key}", response_model=SystemConfigItem)
def update_system_config(key: str, update: SystemConfigUpdate):
    """Update a specific configuration value."""
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema='public')
    
    # 1. Check existence
    existing = db.select('system_config', filters={'key': key}, limit=1)
    if not existing:
        raise HTTPException(status_code=404, detail="Config key not found")
        
    # 2. Update
    data = {"value": update.value, "updated_at": "now()"}
    try:
        updated_rows = db.update('system_config', data, {'key': key})
        if not updated_rows:
             raise HTTPException(status_code=500, detail="Update failed")
        return updated_rows[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
