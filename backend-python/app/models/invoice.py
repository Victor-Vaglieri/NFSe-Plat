from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import BaseApp

class Invoice(BaseApp):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    # No ForeignKey because tenants table is in a different database! (Microservice pattern)
    tenant_id = Column(Integer, index=True)
    
    document_type = Column(String, default="NFS-e") # NF-e, NFS-e, CT-e
    invoice_number = Column(String, index=True) # Added invoice number
    issuer_cnpj = Column(String, index=True)
    issuer_name = Column(String)
    recipient_cnpj = Column(String, index=True)
    description = Column(String) # O que o documento representa
    
    total_value = Column(Float)
    issue_date = Column(DateTime)
    
    status = Column(String, default="PENDING") # PENDING, PROCESSED, ERROR
    file_path = Column(String) # Path to the stored PDF/XML
    raw_extracted_text = Column(Text, nullable=True) # OCR dump
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
