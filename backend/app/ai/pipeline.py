"""
Pipeline Orchestrator
======================
Orchestrates the full AI processing pipeline:
Enhancement → Segmentation → Density → Motion → Risk

Manages per-camera state and provides a thread-safe processing interface.
"""

import cv2
import numpy as np
import time
import threading
import logging
from typing import Dict, Any, Optional, Callable
from collections import defaultdict
from datetime import datetime, timezone

from app.ai.enhancement import FrameEnhancer
from app.ai.segmentation import CrowdSegmentor
from app.ai.density import DensityAnalyzer
from app.ai.motion import MotionAnalyzer
from app.ai.risk import RiskPredictor

logger = logging.getLogger(__name__)


class CameraState:
    """Maintains per-camera processing state."""

    def __init__(self):
        self.prev_gray: Optional[np.ndarray] = None
        self.tracking_points: Optional[np.ndarray] = None
        self.frame_count: int = 0
        self.last_processed: Optional[float] = None
        self.motion_analyzer = MotionAnalyzer()


class ProcessingPipeline:
    """
    Orchestrates the complete AI processing pipeline.
    Thread-safe, maintains per-camera state.
    """

    def __init__(
        self,
        grid_rows: int = 4,
        grid_cols: int = 4,
        hotspot_threshold: float = 70.0,
    ):
        # Shared components (stateless)
        self.enhancer = FrameEnhancer()
        self.segmentor = CrowdSegmentor()
        self.density_analyzer = DensityAnalyzer(
            grid_rows=grid_rows,
            grid_cols=grid_cols,
            hotspot_threshold=hotspot_threshold,
        )
        self.risk_predictor = RiskPredictor()

        # Per-camera state
        self._camera_states: Dict[int, CameraState] = defaultdict(CameraState)
        self._lock = threading.Lock()

    def get_camera_state(self, camera_id: int) -> CameraState:
        """Thread-safe access to camera state."""
        with self._lock:
            return self._camera_states[camera_id]

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: int = 0,
    ) -> Dict[str, Any]:
        """
        Process a single frame through the full pipeline:
        1. Enhancement
        2. Segmentation
        3. Density Analysis
        4. Motion Analysis
        5. Risk Prediction

        Args:
            frame: Raw BGR frame from camera
            camera_id: Camera identifier for state tracking

        Returns:
            Dictionary with all analysis results and visualizations
        """
        start_time = time.time()
        state = self.get_camera_state(camera_id)
        state.frame_count += 1

        # ── Step 1: Image Enhancement ────────────────────────────
        enhanced = self.enhancer.enhance_pipeline(frame)

        # ── Step 2: Crowd Segmentation ───────────────────────────
        seg_result = self.segmentor.segment_pipeline(enhanced)
        binary_mask = seg_result["binary_mask"]
        contours = seg_result["contours"]
        crowd_count = seg_result["crowd_count_estimate"]

        # ── Step 3: Crowd Density Analysis ───────────────────────
        density_result = self.density_analyzer.analyze(
            enhanced, binary_mask, contours, crowd_count
        )

        # ── Step 4: Motion Intelligence ──────────────────────────
        curr_gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
        motion_result = {}

        if state.prev_gray is not None:
            motion_result = state.motion_analyzer.analyze(
                state.prev_gray, curr_gray,
                prev_points=state.tracking_points,
                frame=enhanced,
            )
            state.tracking_points = motion_result.get("tracking_points")
        else:
            # First frame — initialize motion data with zeros
            motion_result = {
                "flow": np.zeros((*curr_gray.shape, 2), dtype=np.float32),
                "speed": {"avg_speed": 0.0, "max_speed": 0.0, "speed_variance": 0.0},
                "direction": {"avg_direction": 0.0, "direction_std": 0.0, "flow_consistency": 100.0},
                "anomalies": {},
                "primary_anomaly_type": "none",
                "primary_anomaly_score": 0.0,
                "motion_visualization": None,
                "flow_hsv": None,
                "tracking_points": None,
            }

        # Update state for next frame
        state.prev_gray = curr_gray
        state.last_processed = time.time()

        # ── Step 5: Risk Prediction ──────────────────────────────
        risk_result = self.risk_predictor.predict(
            density_result, motion_result, state.frame_count
        )

        processing_time = round(time.time() - start_time, 4)

        # ── Compile results ──────────────────────────────────────
        result = {
            "camera_id": camera_id,
            "frame_number": state.frame_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "processing_time_sec": processing_time,

            # Enhanced frame
            "enhanced_frame": enhanced,

            # Segmentation
            "segmentation": {
                "binary_mask": seg_result["binary_mask"],
                "boundaries": seg_result["boundaries"],
                "crowd_regions": seg_result["crowd_regions"],
                "crowd_area_pct": seg_result["crowd_area_pct"],
                "crowd_count_estimate": seg_result["crowd_count_estimate"],
            },

            # Density
            "density": {
                "zone_scores": density_result["zone_scores"],
                "zone_counts": density_result["zone_counts"],
                "overall_density": density_result["overall_density"],
                "overall_level": density_result["overall_level"],
                "congestion_score": density_result["congestion_score"],
                "hotspots": density_result["hotspots"],
                "crowd_count_estimate": density_result["crowd_count_estimate"],
                "occupied_area_pct": density_result["occupied_area_pct"],
                "heatmap": density_result["heatmap"],
                "heatmap_overlay": density_result["heatmap_overlay"],
            },

            # Motion
            "motion": {
                "avg_speed": motion_result["speed"]["avg_speed"],
                "max_speed": motion_result["speed"]["max_speed"],
                "speed_variance": motion_result["speed"]["speed_variance"],
                "avg_direction": motion_result["direction"]["avg_direction"],
                "flow_consistency": motion_result["direction"]["flow_consistency"],
                "primary_anomaly_type": motion_result["primary_anomaly_type"],
                "primary_anomaly_score": motion_result["primary_anomaly_score"],
                "anomalies": {
                    k: {"detected": v.get("detected", False), "score": v.get("score", 0)}
                    for k, v in motion_result.get("anomalies", {}).items()
                },
                "motion_visualization": motion_result.get("motion_visualization"),
                "flow_hsv": motion_result.get("flow_hsv"),
            },

            # Risk
            "risk": risk_result,
        }

        return result

    def process_stream(
        self,
        video_source: Any,
        camera_id: int = 0,
        callback: Optional[Callable] = None,
        frame_interval: float = 0.1,
        stop_event: Optional[threading.Event] = None,
    ):
        """
        Continuously process frames from a video source.

        Args:
            video_source: OpenCV VideoCapture compatible source (file path, RTSP URL, device index)
            camera_id: Camera identifier
            callback: Function called with each frame's results
            frame_interval: Minimum seconds between frame processing
            stop_event: Threading event to signal stop
        """
        cap = cv2.VideoCapture(video_source)

        if not cap.isOpened():
            logger.error(f"Camera {camera_id}: Failed to open video source: {video_source}")
            return

        logger.info(f"Camera {camera_id}: Started processing stream from {video_source}")

        if stop_event is None:
            stop_event = threading.Event()

        try:
            while not stop_event.is_set():
                ret, frame = cap.read()

                if not ret:
                    # If video file, loop back to start
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()
                    if not ret:
                        logger.warning(f"Camera {camera_id}: Cannot read frames, stopping.")
                        break

                # Process frame
                try:
                    result = self.process_frame(frame, camera_id)

                    if callback:
                        callback(result)

                except Exception as e:
                    logger.error(f"Camera {camera_id}: Frame processing error: {e}")

                # Rate limiting
                time.sleep(frame_interval)

        except Exception as e:
            logger.error(f"Camera {camera_id}: Stream processing error: {e}")
        finally:
            cap.release()
            logger.info(f"Camera {camera_id}: Stream processing stopped.")

    def reset_camera(self, camera_id: int):
        """Reset state for a specific camera."""
        with self._lock:
            self._camera_states[camera_id] = CameraState()

    def encode_frame_jpeg(self, frame: np.ndarray, quality: int = 80) -> bytes:
        """Encode a BGR frame to JPEG bytes for WebSocket transmission."""
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        _, buffer = cv2.imencode(".jpg", frame, encode_params)
        return buffer.tobytes()
