from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine_auth, engine_app, BaseAuth, BaseApp

# Import models before APIs so SQLAlchemy registry knows all of them
import app.models.tenant 
import app.models.user
import app.models.api_key
import app.models.contract
import app.models.service_order
import app.models.invoice

from app.api import auth, invoices

# Create tables in DBs (for dev purposes)
BaseAuth.metadata.create_all(bind=engine_auth)
BaseApp.metadata.create_all(bind=engine_app)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the NFSe SaaS Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # TODO: configure allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, invoices, integration, contracts, service_orders, billing
import os

if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Mount static files so frontend can fetch PDFs via URL
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(invoices.router, prefix=f"{settings.API_V1_STR}/invoices", tags=["invoices"])
app.include_router(integration.router, prefix=f"{settings.API_V1_STR}/integration", tags=["erp-integration"])
app.include_router(contracts.router, prefix=f"{settings.API_V1_STR}/contracts", tags=["contracts"])
app.include_router(service_orders.router, prefix=f"{settings.API_V1_STR}/service-orders", tags=["service_orders"])
app.include_router(billing.router, prefix=f"{settings.API_V1_STR}/billing", tags=["billing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the NFSe SaaS API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
