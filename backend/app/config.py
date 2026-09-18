import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_PROJECT_DIR = _BACKEND_DIR.parent

load_dotenv(_PROJECT_DIR / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)

def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    if url.startswith("postgresql+psycopg://"):
        parsed = urlsplit(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        if parsed.hostname and (parsed.hostname.endswith(".supabase.co") or parsed.hostname.endswith(".supabase.com")):
            query.setdefault("sslmode", "require")
            return urlunsplit(parsed._replace(query=urlencode(query)))

    return url

class Settings:
    PROJECT_NAME: str = "KisanKart API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "kiskankart-production-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = _normalize_database_url(
        os.getenv("DATABASE_URL", f"sqlite:///{_BACKEND_DIR / 'kiskankart.db'}")
    )
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in {"1", "true", "yes", "on"}
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

settings = Settings()
