"""
WebSocket handlers for real-time streaming.
Manages connections and broadcasts frames/analytics/alerts.
"""

import asyncio
import json
import logging
import threading
from typing import Dict, Set, Optional
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect
from app.ai.pipeline import ProcessingPipeline

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for multiple channels:
    - Camera live feeds (binary JPEG frames)
    - Camera analytics (JSON data)
    - Global alerts (JSON notifications)
    """

    def __init__(self):
        # camera_id -> set of connected WebSockets
        self.camera_feeds: Dict[int, Set[WebSocket]] = {}
        self.camera_analytics: Dict[int, Set[WebSocket]] = {}
        self.alert_subscribers: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect_camera_feed(self, websocket: WebSocket, camera_id: int):
        await websocket.accept()
        async with self._lock:
            if camera_id not in self.camera_feeds:
                self.camera_feeds[camera_id] = set()
            self.camera_feeds[camera_id].add(websocket)
        logger.info(f"Camera feed client connected: camera={camera_id}")

    async def connect_camera_analytics(self, websocket: WebSocket, camera_id: int):
        await websocket.accept()
        async with self._lock:
            if camera_id not in self.camera_analytics:
                self.camera_analytics[camera_id] = set()
            self.camera_analytics[camera_id].add(websocket)
        logger.info(f"Analytics client connected: camera={camera_id}")

    async def connect_alerts(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.alert_subscribers.add(websocket)
        logger.info("Alert subscriber connected")

    async def disconnect_camera_feed(self, websocket: WebSocket, camera_id: int):
        async with self._lock:
            if camera_id in self.camera_feeds:
                self.camera_feeds[camera_id].discard(websocket)

    async def disconnect_camera_analytics(self, websocket: WebSocket, camera_id: int):
        async with self._lock:
            if camera_id in self.camera_analytics:
                self.camera_analytics[camera_id].discard(websocket)

    async def disconnect_alerts(self, websocket: WebSocket):
        async with self._lock:
            self.alert_subscribers.discard(websocket)

    async def broadcast_frame(self, camera_id: int, frame_bytes: bytes):
        """Send JPEG frame to all connected feed clients for a camera."""
        if camera_id not in self.camera_feeds:
            return
        disconnected = set()
        for ws in self.camera_feeds[camera_id]:
            try:
                await ws.send_bytes(frame_bytes)
            except Exception:
                disconnected.add(ws)
        # Cleanup disconnected
        for ws in disconnected:
            self.camera_feeds[camera_id].discard(ws)

    async def broadcast_analytics(self, camera_id: int, data: dict):
        """Send analytics JSON to all connected analytics clients for a camera."""
        if camera_id not in self.camera_analytics:
            return
        disconnected = set()
        message = json.dumps(data, default=str)
        for ws in self.camera_analytics[camera_id]:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.camera_analytics[camera_id].discard(ws)

    async def broadcast_alert(self, alert_data: dict):
        """Send alert notification to all alert subscribers."""
        disconnected = set()
        message = json.dumps(alert_data, default=str)
        for ws in self.alert_subscribers:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.alert_subscribers.discard(ws)


# Global connection manager
manager = ConnectionManager()

# Global pipeline instance
pipeline = ProcessingPipeline()

# Active camera processing threads
active_streams: Dict[int, threading.Event] = {}


async def handle_camera_feed(websocket: WebSocket, camera_id: int):
    """
    WebSocket endpoint handler for live camera feed.
    Clients receive binary JPEG frames.
    """
    await manager.connect_camera_feed(websocket, camera_id)
    try:
        while True:
            # Keep connection alive, wait for client messages (e.g., ping)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect_camera_feed(websocket, camera_id)
        logger.info(f"Camera feed client disconnected: camera={camera_id}")


async def handle_camera_analytics(websocket: WebSocket, camera_id: int):
    """
    WebSocket endpoint handler for real-time analytics data.
    Clients receive JSON with density, motion, risk data.
    """
    await manager.connect_camera_analytics(websocket, camera_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect_camera_analytics(websocket, camera_id)
        logger.info(f"Analytics client disconnected: camera={camera_id}")


async def handle_alerts(websocket: WebSocket):
    """
    WebSocket endpoint handler for real-time alert notifications.
    """
    await manager.connect_alerts(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await manager.disconnect_alerts(websocket)
        logger.info("Alert subscriber disconnected")


def start_camera_processing(camera_id: int, stream_url: str, loop: asyncio.AbstractEventLoop):
    """
    Start processing a camera stream in a background thread.
    """
    if camera_id in active_streams:
        logger.warning(f"Camera {camera_id} is already being processed")
        return

    stop_event = threading.Event()
    active_streams[camera_id] = stop_event

    def frame_callback(result: dict):
        """Called for each processed frame — pushes data to WebSocket clients."""
        try:
            # Encode frame for feed
            enhanced = result.get("enhanced_frame")
            if enhanced is not None:
                frame_bytes = pipeline.encode_frame_jpeg(enhanced)
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast_frame(camera_id, frame_bytes), loop
                )

            # Send analytics data (without numpy arrays)
            analytics = {
                "camera_id": result["camera_id"],
                "frame_number": result["frame_number"],
                "timestamp": result["timestamp"],
                "processing_time": result["processing_time_sec"],
                "density": {
                    "zone_scores": result["density"]["zone_scores"],
                    "overall_density": result["density"]["overall_density"],
                    "overall_level": result["density"]["overall_level"],
                    "congestion_score": result["density"]["congestion_score"],
                    "hotspots": result["density"]["hotspots"],
                    "crowd_count": result["density"]["crowd_count_estimate"],
                    "occupied_area_pct": result["density"]["occupied_area_pct"],
                },
                "motion": {
                    "avg_speed": result["motion"]["avg_speed"],
                    "max_speed": result["motion"]["max_speed"],
                    "speed_variance": result["motion"]["speed_variance"],
                    "avg_direction": result["motion"]["avg_direction"],
                    "flow_consistency": result["motion"]["flow_consistency"],
                    "anomaly_type": result["motion"]["primary_anomaly_type"],
                    "anomaly_score": result["motion"]["primary_anomaly_score"],
                },
                "risk": result["risk"],
            }
            asyncio.run_coroutine_threadsafe(
                manager.broadcast_analytics(camera_id, analytics), loop
            )

        except Exception as e:
            logger.error(f"Frame callback error for camera {camera_id}: {e}")

    # Start processing in background thread
    thread = threading.Thread(
        target=pipeline.process_stream,
        args=(stream_url, camera_id, frame_callback, 0.1, stop_event),
        daemon=True,
    )
    thread.start()
    logger.info(f"Started processing camera {camera_id}: {stream_url}")


def stop_camera_processing(camera_id: int):
    """Stop processing a camera stream."""
    if camera_id in active_streams:
        active_streams[camera_id].set()
        del active_streams[camera_id]
        pipeline.reset_camera(camera_id)
        logger.info(f"Stopped processing camera {camera_id}")
