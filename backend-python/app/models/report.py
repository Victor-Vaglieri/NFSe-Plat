from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import BaseApp

class Report(BaseApp):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True)
    reference_month = Column(String, index=True) # Ex: "2026-09"
    status = Column(String, default="PENDING") # PENDING, COMPLETED, ERROR
    file_path = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
