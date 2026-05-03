"""ShieldFlow — Application Configuration (Pydantic Settings)."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Central configuration loaded from environment variables."""

    # --- App ---
    APP_NAME: str = "ShieldFlow API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./shieldflow.db"

    # --- Security ---
    JWT_SECRET: str = "shieldflow-dev-secret-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24h
    ENCRYPTION_KEY: str = "shieldflow-encryption-key-32chars!"  # For connector credentials

    # --- AI / LLM ---
    GEMINI_API_KEY: str = ""
    AI_MODEL: str = "gemini-2.5-flash"

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
