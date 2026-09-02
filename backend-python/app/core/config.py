from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NFSe SaaS Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey-change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # DATABASE_URL can be set in a .env file or deployment environment (e.g., Render)
    # Example for Supabase/Neon (PostgreSQL DBaaS): postgresql://user:password@host:port/dbname
    DATABASE_URL: str = "sqlite:///./nfse_saas.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
