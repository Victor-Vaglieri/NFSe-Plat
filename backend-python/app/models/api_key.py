from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import BaseAuth

class APIKey(BaseAuth):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True) # Linked to tenants in auth.db
    key_hash = Column(String, unique=True, index=True)
    name = Column(String) # e.g. "ERP Contábil Key"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
