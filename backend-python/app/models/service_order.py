from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import BaseApp

class ServiceOrder(BaseApp):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    
    description = Column(Text)
    execution_date = Column(DateTime)
    value = Column(Float)
    
    status = Column(String, default="PENDING") # PENDING, EXECUTED, BILLED
    file_path = Column(String, nullable=True) # Path to the uploaded OS file/image
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    contract = relationship("Contract", back_populates="service_orders")
    invoices = relationship("Invoice", back_populates="service_order")
