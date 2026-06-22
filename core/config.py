import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    REFRESH_SECRET_KEY: str = os.getenv(
        "REFRESH_SECRET_KEY",
        os.getenv("SECRET_KEY", "supersecretrefreshkey123") + "_refresh",
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", 8000))
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")


settings = Settings()
