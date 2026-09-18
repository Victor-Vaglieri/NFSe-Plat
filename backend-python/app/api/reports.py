from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db_app
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report
from app.services.report_generator import generate_monthly_report_task

router = APIRouter()

class ReportOut(BaseModel):
    id: int
    reference_month: str
    status: str
    file_path: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class ReportRequest(BaseModel):
    reference_month: str # "2026-09"

@router.post("/", response_model=ReportOut)
def request_report(
    req: ReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_app),
    current_user: User = Depends(get_current_user)
):
    # Check if a report for this month was generated in the last 24h
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    existing = db.query(Report).filter(
        Report.tenant_id == current_user.tenant_id,
        Report.reference_month == req.reference_month,
        Report.created_at >= twenty_four_hours_ago
    ).order_by(Report.created_at.desc()).first()
    
    if existing:
        return existing
        
    # Create new pending report
    new_report = Report(
        tenant_id=current_user.tenant_id,
        reference_month=req.reference_month,
        status="PENDING"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Spawn background task
    background_tasks.add_task(
        generate_monthly_report_task, 
        report_id=new_report.id, 
        tenant_id=current_user.tenant_id, 
        reference_month=req.reference_month
    )
    
    return new_report

@router.get("/", response_model=List[ReportOut])
def list_reports(
    db: Session = Depends(get_db_app),
    current_user: User = Depends(get_current_user)
):
    return db.query(Report).filter(
        Report.tenant_id == current_user.tenant_id
    ).order_by(Report.created_at.desc()).limit(12).all()
