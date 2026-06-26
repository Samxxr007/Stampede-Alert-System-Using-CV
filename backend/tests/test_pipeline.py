"""
Unit tests for the Pipeline Orchestrator.
"""

import numpy as np
import cv2
import pytest
import threading
import time
from unittest.mock import MagicMock, patch
from app.ai.pipeline import ProcessingPipeline, CameraState


@pytest.fixture
def pipeline():
    return ProcessingPipeline(grid_rows=4, grid_cols=4)


@pytest.fixture
def sample_frame():
    # Simple green color frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:, :, 1] = 100  # Green channel
    return frame


class TestProcessingPipeline:
    def test_camera_state_init(self, pipeline):
        state = pipeline.get_camera_state(camera_id=1)
        assert isinstance(state, CameraState)
        assert state.frame_count == 0
        assert state.prev_gray is None
        assert state.tracking_points is None

    def test_process_frame_first(self, pipeline, sample_frame):
        result = pipeline.process_frame(sample_frame, camera_id=1)
        
        assert result["camera_id"] == 1
        assert result["frame_number"] == 1
        assert "timestamp" in result
        assert "processing_time_sec" in result
        assert result["enhanced_frame"].shape == sample_frame.shape

        # Verify default motion features on first frame
        assert result["motion"]["avg_speed"] == 0.0
        assert result["motion"]["flow_consistency"] == 100.0
        assert result["motion"]["primary_anomaly_type"] == "none"
        assert result["motion"]["primary_anomaly_score"] == 0.0

        # State should be updated
        state = pipeline.get_camera_state(camera_id=1)
        assert state.frame_count == 1
        assert state.prev_gray is not None
        assert state.prev_gray.shape == sample_frame.shape[:2]

    def test_process_frame_subsequent(self, pipeline, sample_frame):
        # First frame
        pipeline.process_frame(sample_frame, camera_id=1)

        # Second frame (simulate movement by changing pixels)
        frame2 = sample_frame.copy()
        frame2[100:200, 100:200, 1] = 200

        result = pipeline.process_frame(frame2, camera_id=1)
        assert result["frame_number"] == 2
        
        # Verify motion analyzer was executed
        assert "avg_speed" in result["motion"]
        assert "primary_anomaly_score" in result["motion"]

    def test_reset_camera(self, pipeline, sample_frame):
        # Process a frame to build state
        pipeline.process_frame(sample_frame, camera_id=1)
        state_before = pipeline.get_camera_state(camera_id=1)
        assert state_before.frame_count == 1
        assert state_before.prev_gray is not None

        # Reset camera
        pipeline.reset_camera(camera_id=1)
        state_after = pipeline.get_camera_state(camera_id=1)
        assert state_after.frame_count == 0
        assert state_after.prev_gray is None

    def test_encode_frame_jpeg(self, pipeline, sample_frame):
        jpeg_bytes = pipeline.encode_frame_jpeg(sample_frame, quality=50)
        assert isinstance(jpeg_bytes, bytes)
        assert len(jpeg_bytes) > 0

    @patch("cv2.VideoCapture")
    def test_process_stream(self, mock_vc, pipeline):
        # Mock cap
        mock_cap = MagicMock()
        mock_vc.return_value = mock_cap
        
        # Mock cap.isOpened()
        mock_cap.isOpened.return_value = True
        
        # Mock cap.read()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        mock_cap.read.side_effect = [(True, frame), (True, frame), (False, None)]
        
        # Run process_stream
        stop_event = threading.Event()
        callback = MagicMock()
        
        # Start a thread to stop the processing stream after a tiny sleep
        def stopper():
            time.sleep(0.05)
            stop_event.set()
            
        t = threading.Thread(target=stopper)
        t.start()
        
        pipeline.process_stream(
            video_source="mock_path.mp4",
            camera_id=1,
            callback=callback,
            frame_interval=0.01,
            stop_event=stop_event
        )
        
        t.join()
        
        # cap.release should be called
        mock_cap.release.assert_called_once()
