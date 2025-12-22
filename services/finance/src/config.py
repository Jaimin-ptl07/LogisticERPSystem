"""
Configuration settings for Finance Service
"""
from pydantic_settings import BaseSettings
from typing import List


class FinanceSettings(BaseSettings):
    """Application settings"""

    # Application settings
    APP_NAME: str = "Finance Service"
    VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Server settings
    service_host: str = "0.0.0.0"
    service_port: int = 8005

    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/logistics_erp"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30

    # Redis settings
    REDIS_URL: str = "redis://localhost:6379/1"

    # CORS settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://demo.logistics-erp.com",
    ]
    allowed_methods: List[str] = ["*"]
    allowed_headers: List[str] = ["*"]
    expose_headers: List[str] = []

    # Authentication settings
    JWT_SECRET_KEY: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Orders Service settings
    ORDERS_SERVICE_URL: str = "http://orders-service:8002"
    ORDERS_SERVICE_TIMEOUT: int = 30

    # Audit settings
    AUDIT_LOG_ENABLED: bool = True

    # Rate limiting settings
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = FinanceSettings()