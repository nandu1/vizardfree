"""
VizardFree – Application Configuration
Reads from env variables (set via docker-compose or .env file).
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "VizardFree"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Paths ─────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "/data/uploads"
    OUTPUT_DIR: str = "/data/outputs"
    MODELS_DIR: str = "/data/models"
    FONTS_DIR: str = "/usr/share/fonts"

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:////data/vizardfree.db"

    # ── Redis ─────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    # ── Whisper ───────────────────────────────────────────────────────────
    WHISPER_MODEL: str = "large-v3"
    WHISPER_DEVICE: str = "auto"      # auto | cuda | cpu
    WHISPER_COMPUTE_TYPE: str = "int8"

    # ── Upload Limits ─────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE: int = 2_147_483_648  # 2 GB

    # ── Export Defaults ───────────────────────────────────────────────────
    DEFAULT_EXPORT_QUALITY: str = "1080p"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    def ensure_dirs(self):
        for d in [self.UPLOAD_DIR, self.OUTPUT_DIR, self.MODELS_DIR]:
            Path(d).mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    s.ensure_dirs()
    return s
