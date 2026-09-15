import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db_app
from app.models.service_order import ServiceOrder
from app.models.contract import Contract
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter()

class ServiceOrderOut(BaseModel):
    id: int
    contract_id: int
    description: str
    execution_date: datetime
    value: float
    status: str
    file_path: Optional[str]
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[ServiceOrderOut])
def get_service_orders(db: Session = Depends(get_db_app), current_user: User = Depends(get_current_user)):
    return db.query(ServiceOrder).filter(ServiceOrder.tenant_id == current_user.tenant_id).all()

@router.post("/", response_model=ServiceOrderOut)
def create_service_order(
    contract_id: int = Form(...),
    description: str = Form(...),
    value: float = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db_app),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.tenant_id == current_user.tenant_id).first()
    if not contract:
        raise HTTPException(status_code=400, detail="Contrato não encontrado.")

    file_path_str = None
    if file:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        target_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(target_path, "wb") as f:
            f.write(file.file.read())
        file_path_str = f"uploads/{unique_filename}"

    os_model = ServiceOrder(
        tenant_id=current_user.tenant_id,
        contract_id=contract_id,
        description=description,
        value=value,
        execution_date=datetime.utcnow(),
        status="PENDING",
        file_path=file_path_str
    )
    
    db.add(os_model)
    db.commit()
    db.refresh(os_model)
    return os_model
