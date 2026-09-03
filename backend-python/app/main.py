from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth
from app.database import engine, Base
import app.models.tenant # Import to register models
import app.models.user
import app.models.invoice

# Create tables in DB (for dev purposes, normally use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the NFSe SaaS Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, invoices

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(invoices.router, prefix=f"{settings.API_V1_STR}/invoices", tags=["invoices"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the NFSe SaaS API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
