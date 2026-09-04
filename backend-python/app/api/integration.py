from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db_auth, get_db_app
from app.models.api_key import APIKey
from app.models.invoice import Invoice

router = APIRouter()

API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_tenant_by_api_key(
    api_key_header: str = Security(api_key_header),
    db_auth: Session = Depends(get_db_auth)
):
    if not api_key_header:
        raise HTTPException(status_code=401, detail="API Key header missing")
        
    # In a real app, hash the incoming key and compare with DB. 
    # For MVP, we'll assume the header matches the key exactly.
    api_key_record = db_auth.query(APIKey).filter(APIKey.key_hash == api_key_header, APIKey.is_active == True).first()
    
    if not api_key_record:
        raise HTTPException(status_code=403, detail="Could not validate API KEY")
        
    return api_key_record.tenant_id

@router.get("/invoices")
def get_invoices_for_erp(
    tenant_id: int = Depends(get_tenant_by_api_key),
    db_app: Session = Depends(get_db_app)
):
    """
    Endpoint for ERP systems to fetch invoices via API Key (M2M).
    Crosses databases: validates auth via AuthDB, fetches data from AppDB.
    """
    invoices = db_app.query(Invoice).filter(Invoice.tenant_id == tenant_id, Invoice.status == "PROCESSADO").order_by(Invoice.created_at.desc()).all()
    
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "issuer_cnpj": inv.issuer_cnpj,
            "total_value": inv.total_value,
            "processed_at": inv.created_at
        }
        for inv in invoices
    ]
