"""
Unit tests for the Crowd Segmentation Engine (Module 2).
"""

import numpy as np
import cv2
import pytest
from app.ai.segmentation import CrowdSegmentor


@pytest.fixture
def segmentor():
    # Use smaller min_contour_area for tests so small synthetic contours are detected
    return CrowdSegmentor(min_contour_area=20)


@pytest.fixture
def sample_frame():
    """Create a synthetic BGR frame with a solid background and some white circles (crowd)."""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    # Add some foreground blobs
    cv2.circle(frame, (150, 150), 40, (180, 180, 180), -1)
    cv2.circle(frame, (350, 250), 60, (200, 200, 200), -1)
    return frame


@pytest.fixture
def gray_frame(sample_frame):
    return cv2.cvtColor(sample_frame, cv2.COLOR_BGR2GRAY)


class TestCrowdSegmentor:
    def test_adaptive_threshold(self, segmentor, gray_frame):
        result = segmentor.adaptive_threshold(gray_frame)
        assert result.shape == gray_frame.shape
        assert result.dtype == np.uint8

    def test_otsu_threshold(self, segmentor, gray_frame):
        result = segmentor.otsu_threshold(gray_frame)
        assert result.shape == gray_frame.shape
        assert result.dtype == np.uint8

    def test_canny_edges(self, segmentor, gray_frame):
        result = segmentor.canny_edges(gray_frame)
        assert result.shape == gray_frame.shape
        assert result.dtype == np.uint8

    def test_watershed_segment(self, segmentor, sample_frame):
        markers, colored = segmentor.watershed_segment(sample_frame)
        assert markers.shape == sample_frame.shape[:2]
        assert colored.shape == sample_frame.shape

    def test_region_growing(self, segmentor, gray_frame):
        # Test with custom seeds
        seeds = [(150, 150), (350, 250)]
        result = segmentor.region_growing(gray_frame, seeds=seeds)
        assert result.shape == gray_frame.shape
        # Should have detected some region
        assert np.sum(result > 0) > 0

        # Test auto seeds detection
        result_auto = segmentor.region_growing(gray_frame)
        assert result_auto.shape == gray_frame.shape
        assert np.sum(result_auto > 0) > 0

    def test_find_contours(self, segmentor, gray_frame):
        _, binary = cv2.threshold(gray_frame, 50, 255, cv2.THRESH_BINARY)
        contours = segmentor.find_contours(binary)
        # Should find at least 2 contours corresponding to our 2 circles
        assert len(contours) >= 2
        assert cv2.contourArea(contours[0]) >= segmentor.min_contour_area

    def test_morphological_ops(self, segmentor):
        # Create a noisy binary mask
        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[40:60, 40:60] = 255
        # Add single noise pixel
        mask[10, 10] = 255
        
        result = segmentor.morphological_ops(mask)
        assert result.shape == mask.shape
        # Noise pixel at (10, 10) should be removed by opening
        assert result[10, 10] == 0
        # Main square should be retained/dilated
        assert np.sum(result[40:60, 40:60]) > 0

    def test_extract_boundaries(self, segmentor, gray_frame):
        _, binary = cv2.threshold(gray_frame, 50, 255, cv2.THRESH_BINARY)
        contours = segmentor.find_contours(binary)
        boundaries = segmentor.extract_boundaries(contours, gray_frame.shape)
        assert boundaries.shape == gray_frame.shape
        assert boundaries.dtype == np.uint8
        assert np.sum(boundaries > 0) > 0

    def test_background_subtract(self, segmentor, sample_frame):
        # We need to feed it a few times to build history
        for _ in range(5):
            mask = segmentor.background_subtract(sample_frame)
        assert mask.shape == sample_frame.shape[:2]
        assert mask.dtype == np.uint8

    def test_segment_pipeline(self, segmentor, sample_frame):
        result = segmentor.segment_pipeline(sample_frame)
        assert "binary_mask" in result
        assert "contours" in result
        assert "boundaries" in result
        assert "crowd_regions" in result
        assert "crowd_area" in result
        assert "crowd_area_pct" in result
        assert "crowd_count_estimate" in result

        assert result["binary_mask"].shape == sample_frame.shape[:2]
        assert len(result["contours"]) >= 1
        assert result["crowd_area"] > 0
        assert result["crowd_area_pct"] > 0
        assert result["crowd_count_estimate"] >= 1
        assert len(result["crowd_regions"]) >= 1
        assert "bbox" in result["crowd_regions"][0]
        assert "area" in result["crowd_regions"][0]
        assert "centroid" in result["crowd_regions"][0]
