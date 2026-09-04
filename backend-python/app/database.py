from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# --- Auth Database (Users, Tenants, API Keys) ---
engine_auth = create_engine(
    settings.AUTH_DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.AUTH_DATABASE_URL.startswith("sqlite") else {}
)
SessionLocalAuth = sessionmaker(autocommit=False, autoflush=False, bind=engine_auth)
BaseAuth = declarative_base()

def get_db_auth():
    db = SessionLocalAuth()
    try:
        yield db
    finally:
        db.close()

# --- App Database (Invoices) ---
engine_app = create_engine(
    settings.APP_DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.APP_DATABASE_URL.startswith("sqlite") else {}
)
SessionLocalApp = sessionmaker(autocommit=False, autoflush=False, bind=engine_app)
BaseApp = declarative_base()

def get_db_app():
    db = SessionLocalApp()
    try:
        yield db
    finally:
        db.close()
