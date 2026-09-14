from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import BaseApp

class Contract(BaseApp):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True)
    
    client_name = Column(String, index=True)
    client_cnpj = Column(String, index=True)
    
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    
    total_value = Column(Float, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    service_orders = relationship("ServiceOrder", back_populates="contract", cascade="all, delete-orphan")
