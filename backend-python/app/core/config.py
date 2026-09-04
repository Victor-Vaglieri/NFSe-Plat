from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NFSe SaaS Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey-change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database Configuration for Microservices/Separation pattern
    # 1. Auth Database (Users, Tenants, API Keys)
    AUTH_DATABASE_URL: str = "sqlite:///./auth.db"
    
    # 2. Application Database (Invoices, OCR data)
    APP_DATABASE_URL: str = "sqlite:///./nfse.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
