from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    
    document_type = Column(String, default="NFS-e") # NF-e, NFS-e, CT-e
    issuer_cnpj = Column(String, index=True)
    issuer_name = Column(String)
    recipient_cnpj = Column(String, index=True)
    
    total_value = Column(Float)
    issue_date = Column(DateTime)
    
    status = Column(String, default="PENDING") # PENDING, PROCESSED, ERROR
    file_path = Column(String) # Path to the stored PDF/XML
    raw_extracted_text = Column(Text, nullable=True) # OCR dump
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tenant = relationship("Tenant")
