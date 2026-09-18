from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db_app
from app.models.contract import Contract
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class ContractCreate(BaseModel):
    client_name: str
    client_cnpj: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_value: Optional[float] = None

class ContractOut(BaseModel):
    id: int
    client_name: str
    client_cnpj: str
    start_date: datetime
    end_date: Optional[datetime]
    total_value: Optional[float]
    status: str
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[ContractOut])
def get_contracts(db: Session = Depends(get_db_app), current_user: User = Depends(get_current_user)):
    return db.query(Contract).filter(Contract.tenant_id == current_user.tenant_id).all()

@router.post("/", response_model=ContractOut)
def create_contract(contract_in: ContractCreate, db: Session = Depends(get_db_app), current_user: User = Depends(get_current_user)):
    contract = Contract(
        tenant_id=current_user.tenant_id,
        client_name=contract_in.client_name,
        client_cnpj=contract_in.client_cnpj,
        start_date=contract_in.start_date or datetime.utcnow(),
        end_date=contract_in.end_date,
        total_value=contract_in.total_value,
        status="ACTIVE"
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
class ContractStatusUpdate(BaseModel):
    status: str

@router.patch("/{contract_id}/status", response_model=ContractOut)
def update_contract_status(contract_id: int, status_update: ContractStatusUpdate, db: Session = Depends(get_db_app), current_user: User = Depends(get_current_user)):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.tenant_id == current_user.tenant_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.status = status_update.status
    db.commit()
    db.refresh(contract)
    return contract


