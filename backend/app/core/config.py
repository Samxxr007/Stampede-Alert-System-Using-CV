"""
Application configuration using pydantic-settings.
All settings can be overridden via environment variables or .env file.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "Smart Crowd Risk Analysis"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://crowduser:crowdpass@localhost:5432/crowddb"
    DATABASE_ECHO: bool = False

    # ── Authentication ───────────────────────────────────────────
    SECRET_KEY: str = "super-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # ── File Storage ─────────────────────────────────────────────
    STORAGE_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "storage")
    FRAMES_DIR: str = "frames"
    CLIPS_DIR: str = "clips"
    HEATMAPS_DIR: str = "heatmaps"
    SNAPSHOTS_DIR: str = "snapshots"

    # ── Alert Thresholds ─────────────────────────────────────────
    DENSITY_THRESHOLD_HIGH: float = 70.0
    DENSITY_THRESHOLD_CRITICAL: float = 85.0
    RISK_THRESHOLD_WARNING: float = 50.0
    RISK_THRESHOLD_CRITICAL: float = 75.0
    MOTION_ANOMALY_THRESHOLD: float = 60.0
    SPEED_ANOMALY_THRESHOLD: float = 70.0

    # ── Alert Channels (Placeholder configs) ─────────────────────
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "alerts@crowdrisk.ai"

    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_FROM: Optional[str] = None

    # ── Processing ───────────────────────────────────────────────
    FRAME_PROCESS_INTERVAL: float = 0.1  # seconds between frames
    MAX_CAMERAS: int = 16
    ZONE_GRID_ROWS: int = 4
    ZONE_GRID_COLS: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
