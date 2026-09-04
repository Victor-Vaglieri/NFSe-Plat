from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
import uuid

from app.database import get_db_app
from app.api.deps import get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.services.ocr import extract_text_from_pdf, parse_nfs_e_data

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_app)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Somente arquivos PDF são aceitos.")

    # 1. Save file locally (Simulating S3 bucket storage)
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar o arquivo: {str(e)}")

    # 2. Run OCR
    try:
        raw_text = extract_text_from_pdf(file_path)
        extracted_data = parse_nfs_e_data(raw_text)
    except Exception as e:
        # Save invoice with ERROR status
        failed_invoice = Invoice(
            tenant_id=current_user.tenant_id,
            status="ERRO",
            file_path=file_path,
            raw_extracted_text=str(e)
        )
        db.add(failed_invoice)
        db.commit()
        raise HTTPException(status_code=500, detail="Erro durante o processamento do OCR.")

    # Convert issue_date string to datetime object if possible
    issue_date_obj = None
    if extracted_data.get("issue_date"):
        try:
            issue_date_obj = datetime.strptime(extracted_data["issue_date"], "%d/%m/%Y")
        except:
            pass

    # 3. Save into Database
    invoice = Invoice(
        tenant_id=current_user.tenant_id,
        document_type="NFS-e",
        invoice_number=extracted_data.get("invoice_number"),
        issuer_cnpj=extracted_data.get("issuer_cnpj"),
        total_value=extracted_data.get("total_value"),
        description=extracted_data.get("description"),
        issue_date=issue_date_obj,
        status="PROCESSADO",
        file_path=file_path,
        raw_extracted_text=extracted_data.get("raw_text")
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return {
        "message": "Nota fiscal processada com sucesso!",
        "invoice_id": invoice.id,
        "extracted_data": {
            "invoice_number": invoice.invoice_number,
            "issuer_cnpj": invoice.issuer_cnpj,
            "total_value": invoice.total_value,
            "status": invoice.status
        }
    }

@router.get("/")
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_app)
):
    # Fetch all invoices belonging to the current user's tenant
    invoices = db.query(Invoice).filter(Invoice.tenant_id == current_user.tenant_id).order_by(Invoice.created_at.desc()).all()
    return invoices
