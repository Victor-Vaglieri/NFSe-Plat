from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core import security
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Check if tenant exists, otherwise create
    tenant = db.query(Tenant).filter(Tenant.cnpj == user_in.tenant_cnpj).first()
    if not tenant:
        tenant = Tenant(name=user_in.tenant_name, cnpj=user_in.tenant_cnpj)
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
    # Create user
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        tenant_id=tenant.id,
        is_superuser=True # First user of the tenant is superuser
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_access_token(user_in: UserLogin, db: Session = Depends(get_db)):
    # Authenticate
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    # Generate token
    access_token_expires = timedelta(minutes=60 * 24 * 7) # 7 days
    access_token = security.create_access_token(
        subject=user.id, tenant_id=user.tenant_id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
