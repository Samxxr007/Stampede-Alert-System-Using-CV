"""
Unit tests for the Crowd Density Analysis module (Module 3).
"""

import numpy as np
import cv2
import pytest
from app.ai.density import DensityAnalyzer


@pytest.fixture
def analyzer():
    return DensityAnalyzer(grid_rows=4, grid_cols=4, hotspot_threshold=70.0)


@pytest.fixture
def sample_frame():
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def sample_mask():
    # Create a mask with a 120x160 rectangle in the top-left (occupying zone_0_0)
    # The image is 480x640, grid is 4x4, so each zone is 120x160.
    mask = np.zeros((480, 640), dtype=np.uint8)
    mask[0:120, 0:160] = 255
    # Half of the next zone (zone_0_1, which is at y in [0, 120], x in [160, 320])
    mask[0:120, 160:240] = 255
    return mask


@pytest.fixture
def sample_contours():
    # Create two simple contours
    contour1 = np.array([[[10, 10]], [[10, 30]], [[30, 30]], [[30, 10]]], dtype=np.int32)
    # Centroid will be at (20, 20) -> zone_0_0
    contour2 = np.array([[[200, 10]], [[200, 30]], [[220, 30]], [[220, 10]]], dtype=np.int32)
    # Centroid will be at (210, 20) -> zone_0_1
    return [contour1, contour2]


class TestDensityAnalyzer:
    def test_divide_zones(self, analyzer, sample_frame):
        zones = analyzer.divide_zones(sample_frame.shape)
        assert len(zones) == 16
        assert "zone_0_0" in zones
        assert zones["zone_0_0"]["x"] == 0
        assert zones["zone_0_0"]["y"] == 0
        assert zones["zone_0_0"]["w"] == 160
        assert zones["zone_0_0"]["h"] == 120

    def test_count_per_zone(self, analyzer, sample_frame, sample_contours):
        zones = analyzer.divide_zones(sample_frame.shape)
        counts = analyzer.count_per_zone(sample_contours, zones)
        assert counts["zone_0_0"] == 1
        assert counts["zone_0_1"] == 1
        assert counts["zone_1_0"] == 0

    def test_estimate_occupied_area(self, analyzer, sample_mask, sample_frame):
        zones = analyzer.divide_zones(sample_frame.shape)
        occupancy = analyzer.estimate_occupied_area(sample_mask, zones)
        # zone_0_0 is 100% occupied
        assert occupancy["zone_0_0"] == 100.0
        # zone_0_1 is 50% occupied
        assert occupancy["zone_0_1"] == 50.0
        # zone_1_1 is 0% occupied
        assert occupancy["zone_1_1"] == 0.0

    def test_compute_density_score(self, analyzer):
        zone_occupancy = {"zone_0_0": 100.0, "zone_0_1": 45.0, "zone_1_0": 10.0}
        scores = analyzer.compute_density_score(zone_occupancy)
        assert scores["zone_0_0"]["score"] == 100.0
        assert scores["zone_0_0"]["level"] == "critical"
        assert scores["zone_0_1"]["level"] == "medium"
        assert scores["zone_1_0"]["level"] == "low"

    def test_detect_hotspots(self, analyzer):
        zone_scores = {
            "zone_0_0": {"score": 85.0, "level": "critical"},
            "zone_0_1": {"score": 45.0, "level": "medium"},
            "zone_1_0": {"score": 75.0, "level": "high"}
        }
        hotspots = analyzer.detect_hotspots(zone_scores)
        assert len(hotspots) == 2
        assert hotspots[0]["zone"] == "zone_0_0"
        assert hotspots[1]["zone"] == "zone_1_0"

    def test_compute_congestion_score(self, analyzer):
        # Empty
        assert analyzer.compute_congestion_score({}) == 0.0

        # Uniform low
        zone_scores = {f"zone_{r}_{c}": {"score": 10.0, "level": "low"} for r in range(4) for c in range(4)}
        score_low = analyzer.compute_congestion_score(zone_scores)
        assert score_low < 30.0

        # High/critical
        zone_scores["zone_0_0"] = {"score": 90.0, "level": "critical"}
        zone_scores["zone_0_1"] = {"score": 85.0, "level": "critical"}
        score_high = analyzer.compute_congestion_score(zone_scores)
        assert score_high > score_low

    def test_generate_and_overlay_heatmap(self, analyzer, sample_frame):
        zones = analyzer.divide_zones(sample_frame.shape)
        zone_scores = {k: {"score": 50.0, "level": "medium", "color": (0, 255, 255)} for k in zones}
        heatmap = analyzer.generate_heatmap(zone_scores, sample_frame.shape, zones)
        assert heatmap.shape == sample_frame.shape
        assert heatmap.dtype == np.uint8

        overlay = analyzer.overlay_heatmap(sample_frame, heatmap)
        assert overlay.shape == sample_frame.shape

    def test_analyze(self, analyzer, sample_frame, sample_mask, sample_contours):
        result = analyzer.analyze(sample_frame, sample_mask, sample_contours, crowd_count_estimate=5)
        assert "zones" in result
        assert "zone_scores" in result
        assert "zone_counts" in result
        assert "overall_density" in result
        assert "overall_level" in result
        assert "congestion_score" in result
        assert "heatmap" in result
        assert "heatmap_overlay" in result
        assert "hotspots" in result
        assert "crowd_count_estimate" in result
        assert "occupied_area_pct" in result

        assert result["overall_density"] > 0
        assert result["congestion_score"] > 0
        assert result["crowd_count_estimate"] == 5
        assert result["occupied_area_pct"] > 0
