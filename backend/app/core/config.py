"""Application configuration using pydantic-settings."""

from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    # App
    APP_NAME: str = "ESG360"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,https://esg360.digital,https://www.esg360.digital"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/esg360"
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        """Ensure DATABASE_URL uses the asyncpg driver."""
        if v and v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v and v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth - JWT
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Auth - Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "https://api.esg360.digital/api/v1/auth/google/callback"

    # Email - Resend
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@esg360.digital"
    FRONTEND_URL: str = "https://esg360.digital"

    # AI - Multi-provider router
    # Primary: Anthropic Claude (enterprise + EU compliant)
    # Fallback chain: ANTHROPIC -> OPENAI -> DEEPSEEK
    AI_PROVIDER_PRIMARY: str = "deepseek"  # anthropic | openai | deepseek
    AI_PROVIDER_FALLBACKS: str = ""  # comma-separated, e.g. "openai,deepseek"

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # AI - DeepSeek
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # Data residency for AI calls (eu | us | br | global)
    AI_DATA_RESIDENCY: str = "global"

    # PII redaction before sending to external LLMs
    AI_PII_REDACTION: bool = True

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "uploads"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Stripe
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_PROFESSIONAL_MONTHLY: Optional[str] = None
    STRIPE_PRICE_PROFESSIONAL_YEARLY: Optional[str] = None

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> str:
        """Normalize CORS origins to a comma-separated string."""
        if isinstance(v, list):
            return ",".join(v)
        if not v or (isinstance(v, str) and not v.strip()):
            return "http://localhost:3000"
        return str(v)

    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string or JSON array."""
        import json as _json
        val = self.BACKEND_CORS_ORIGINS.strip()
        if not val:
            origins = ["http://localhost:3000"]
        elif val.startswith("["):
            origins = _json.loads(val)
        else:
            origins = [i.strip() for i in val.split(",") if i.strip()]

        # Always ensure FRONTEND_URL is included in CORS origins
        frontend = self.FRONTEND_URL.strip().rstrip("/")
        if frontend and frontend not in origins:
            origins.append(frontend)

        return origins

    @model_validator(mode="after")
    def validate_secret_key_in_production(self) -> "Settings":
        """Prevent the default SECRET_KEY from being used in production."""
        if (
            self.ENVIRONMENT == "production"
            and self.SECRET_KEY == "change-me-in-production-use-openssl-rand-hex-32"
        ):
            raise ValueError(
                "SECRET_KEY must be changed from the default value in production. "
                "Run: openssl rand -hex 32"
            )
        return self

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
