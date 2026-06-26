"""
Unit tests for the Motion Intelligence module (Module 4).
"""

import numpy as np
import cv2
import pytest
from app.ai.motion import MotionAnalyzer


@pytest.fixture
def analyzer():
    return MotionAnalyzer(
        max_corners=50,
        speed_history_size=10,
        sudden_speed_factor=2.5
    )


@pytest.fixture
def synthetic_movement():
    """Create two gray frames with a moving square."""
    frame1 = np.zeros((120, 160), dtype=np.uint8)
    # Draw a white square
    frame1[40:80, 40:80] = 255

    frame2 = np.zeros((120, 160), dtype=np.uint8)
    # Move the white square right by 4 pixels and down by 2 pixels
    frame2[42:82, 44:84] = 255

    # Draw color frame for visualization tests
    color_frame = np.zeros((120, 160, 3), dtype=np.uint8)
    return frame1, frame2, color_frame


class TestMotionAnalyzer:
    def test_farneback_flow(self, analyzer, synthetic_movement):
        f1, f2, _ = synthetic_movement
        flow = analyzer.farneback(f1, f2)
        assert flow.shape == (f1.shape[0], f1.shape[1], 2)
        # Flow should be detected around the moving square
        assert np.sum(np.abs(flow) > 0.1) > 0

    def test_lucas_kanade(self, analyzer, synthetic_movement):
        f1, f2, _ = synthetic_movement
        # Draw some corner points in f1 to track
        cv2.circle(f1, (20, 20), 3, 255, -1)
        cv2.circle(f1, (100, 100), 3, 255, -1)
        
        # Test LK tracking
        good_new, good_old, status = analyzer.lucas_kanade(f1, f2)
        # Should return tracking arrays (they might be empty if features aren't strong, but structure should match)
        assert isinstance(good_new, np.ndarray)
        assert isinstance(good_old, np.ndarray)
        assert isinstance(status, np.ndarray)

    def test_compute_vectors(self, analyzer):
        flow = np.zeros((10, 10, 2), dtype=np.float32)
        flow[:, :, 0] = 3.0  # dx = 3
        flow[:, :, 1] = 4.0  # dy = 4

        mag, ang = analyzer.compute_vectors(flow)
        assert np.allclose(mag, 5.0)  # sqrt(3^2 + 4^2) = 5
        assert np.allclose(ang, np.degrees(np.arctan2(4.0, 3.0)), atol=1e-2)

    def test_compute_speed_and_direction(self, analyzer):
        flow = np.zeros((20, 20, 2), dtype=np.float32)
        flow[5:15, 5:15, 0] = 5.0  # moving right

        speed = analyzer.compute_speed(flow)
        assert speed["avg_speed"] == 5.0
        assert speed["max_speed"] == 5.0
        assert speed["speed_variance"] == 0.0

        direction = analyzer.compute_direction(flow)
        assert 0.0 <= direction["avg_direction"] <= 360.0
        assert direction["flow_consistency"] == 100.0

    def test_detect_opposing_movement(self, analyzer):
        flow = np.zeros((40, 40, 2), dtype=np.float32)
        # Left half moving right (+5.0 dx)
        flow[0:40, 0:20, 0] = 5.0
        # Right half moving left (-5.0 dx)
        flow[0:40, 20:40, 0] = -5.0

        opp = analyzer.detect_opposing_movement(flow, grid_rows=2, grid_cols=2)
        assert opp["detected"]
        assert opp["score"] > 0
        assert len(opp["pairs"]) > 0

    def test_detect_sudden_running(self, analyzer):
        # Establish stable history: 1.0 speed
        for _ in range(5):
            analyzer.detect_running = analyzer.detect_sudden_running(1.0)

        # Trigger sudden running: speed spikes to 5.0
        run_data = analyzer.detect_sudden_running(5.0)
        assert run_data["detected"]
        assert run_data["score"] > 0
        assert run_data["speed_ratio"] >= 2.5

    def test_detect_dispersion_and_convergence(self, analyzer):
        h, w = 40, 40
        cx, cy = w / 2, h / 2
        y, x = np.mgrid[0:h, 0:w]
        dx = x - cx
        dy = y - cy
        dist = np.sqrt(dx**2 + dy**2)
        dist[dist == 0] = 1.0

        # Dispersion: radial flow outward
        disp_flow = np.zeros((h, w, 2), dtype=np.float32)
        disp_flow[..., 0] = (dx / dist) * 5.0
        disp_flow[..., 1] = (dy / dist) * 5.0

        disp_res = analyzer.detect_dispersion(disp_flow)
        assert disp_res["detected"] is True
        assert disp_res["score"] > 50

        # Convergence: radial flow inward
        conv_flow = -disp_flow
        conv_res = analyzer.detect_convergence(conv_flow)
        assert conv_res["detected"] is True
        assert conv_res["score"] > 50

    def test_detect_chaos(self, analyzer):
        flow = np.zeros((20, 20, 2), dtype=np.float32)
        # Random directions
        flow[..., 0] = np.random.uniform(-5.0, 5.0, (20, 20))
        flow[..., 1] = np.random.uniform(-5.0, 5.0, (20, 20))

        chaos = analyzer.detect_chaos(flow)
        assert chaos["detected"] is True
        assert chaos["score"] > 0

    def test_visualizations(self, analyzer):
        flow = np.zeros((40, 40, 2), dtype=np.float32)
        flow[..., 0] = 2.0
        frame = np.zeros((40, 40, 3), dtype=np.uint8)

        vis = analyzer.visualize_flow(frame, flow, step=8)
        assert vis.shape == frame.shape
        assert vis.dtype == np.uint8

        vis_hsv = analyzer.visualize_flow_hsv(flow)
        assert vis_hsv.shape == frame.shape
        assert vis_hsv.dtype == np.uint8

    def test_analyze(self, analyzer, synthetic_movement):
        f1, f2, color_frame = synthetic_movement
        # We need to run it at least once to build history
        result = analyzer.analyze(f1, f2, frame=color_frame)
        assert "flow" in result
        assert "speed" in result
        assert "direction" in result
        assert "anomalies" in result
        assert "primary_anomaly_type" in result
        assert "primary_anomaly_score" in result
        assert "motion_visualization" in result
        assert "flow_hsv" in result
        assert "tracking_points" in result

        assert result["flow"].shape == (f1.shape[0], f1.shape[1], 2)
        assert isinstance(result["primary_anomaly_score"], float)
        assert result["motion_visualization"].shape == color_frame.shape
        assert result["flow_hsv"].shape == color_frame.shape
