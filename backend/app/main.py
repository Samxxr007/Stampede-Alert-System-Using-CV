"""
Smart Crowd Risk Analysis — FastAPI Application
=================================================
Main entry point for the backend server.
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.auth import router as auth_router
from app.api.cameras import router as cameras_router
from app.api.alerts import router as alerts_router
from app.api.analytics import router as analytics_router
from app.websocket.handlers import (
    handle_camera_feed,
    handle_camera_analytics,
    handle_alerts,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    # ── Startup ──────────────────────────────────────────────────
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create storage directories
    storage_base = os.path.abspath(settings.STORAGE_DIR)
    for subdir in [settings.FRAMES_DIR, settings.CLIPS_DIR, settings.HEATMAPS_DIR, settings.SNAPSHOTS_DIR]:
        path = os.path.join(storage_base, subdir)
        os.makedirs(path, exist_ok=True)

    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    logger.info("Shutting down...")
    await close_db()
    logger.info("👋 Application stopped")


# ── Create FastAPI Application ───────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered surveillance platform for real-time crowd risk analysis",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS Middleware ──────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST API Routes ──────────────────────────────────────────────

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(cameras_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)


# ── WebSocket Endpoints ─────────────────────────────────────────

@app.websocket("/ws/camera/{camera_id}/feed")
async def ws_camera_feed(websocket: WebSocket, camera_id: int):
    """WebSocket endpoint for live camera feed (binary JPEG frames)."""
    await handle_camera_feed(websocket, camera_id)


@app.websocket("/ws/camera/{camera_id}/analytics")
async def ws_camera_analytics(websocket: WebSocket, camera_id: int):
    """WebSocket endpoint for real-time analytics data (JSON)."""
    await handle_camera_analytics(websocket, camera_id)


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alert notifications."""
    await handle_alerts(websocket)


# ── Health Check ─────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }
