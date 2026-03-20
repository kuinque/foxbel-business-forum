from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://loyalty:loyalty_secret@localhost:5435/loyalty_db"
    
    # Telegram
    telegram_bot_token: str = ""
    
    # JWT
    jwt_secret: str = "your-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_hours: int = 168  # 7 days
    
    # QR Token
    qr_token_ttl_hours: int = 24
    
    # App
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
