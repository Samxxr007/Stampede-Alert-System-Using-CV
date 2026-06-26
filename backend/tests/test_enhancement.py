"""
Unit tests for the Image Enhancement Engine (Module 1).
"""

import numpy as np
import cv2
import pytest
from app.ai.enhancement import FrameEnhancer


@pytest.fixture
def enhancer():
    return FrameEnhancer()


@pytest.fixture
def sample_frame():
    """Create a sample BGR frame."""
    return np.random.randint(50, 200, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def dark_frame():
    """Create a dark/low-light frame."""
    return np.random.randint(0, 30, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def gray_frame(sample_frame):
    return cv2.cvtColor(sample_frame, cv2.COLOR_BGR2GRAY)


class TestFrameEnhancer:
    def test_histogram_equalization(self, enhancer, sample_frame):
        result = enhancer.histogram_equalization(sample_frame)
        assert result.shape == sample_frame.shape
        assert result.dtype == np.uint8

    def test_histogram_equalization_gray(self, enhancer, gray_frame):
        result = enhancer.histogram_equalization(gray_frame)
        assert result.shape == gray_frame.shape

    def test_clahe(self, enhancer, sample_frame):
        result = enhancer.clahe(sample_frame)
        assert result.shape == sample_frame.shape
        assert result.dtype == np.uint8

    def test_gaussian_filter(self, enhancer, sample_frame):
        result = enhancer.gaussian_filter(sample_frame)
        assert result.shape == sample_frame.shape

    def test_median_filter(self, enhancer, sample_frame):
        result = enhancer.median_filter(sample_frame)
        assert result.shape == sample_frame.shape

    def test_bilateral_filter(self, enhancer, sample_frame):
        result = enhancer.bilateral_filter(sample_frame)
        assert result.shape == sample_frame.shape

    def test_sharpen(self, enhancer, sample_frame):
        result = enhancer.sharpen(sample_frame)
        assert result.shape == sample_frame.shape

    def test_low_light_enhance(self, enhancer, dark_frame):
        result = enhancer.low_light_enhance(dark_frame)
        assert result.shape == dark_frame.shape
        # Should be brighter
        assert np.mean(result) > np.mean(dark_frame)

    def test_contrast_enhancement(self, enhancer, sample_frame):
        result = enhancer.contrast_enhancement(sample_frame)
        assert result.shape == sample_frame.shape

    def test_is_dark_detection(self, enhancer, sample_frame, dark_frame):
        assert not enhancer._is_dark(sample_frame)
        assert enhancer._is_dark(dark_frame)

    def test_enhance_pipeline(self, enhancer, sample_frame):
        result = enhancer.enhance_pipeline(sample_frame)
        assert result.shape == sample_frame.shape
        assert result.dtype == np.uint8

    def test_enhance_pipeline_low_light(self, enhancer, dark_frame):
        result = enhancer.enhance_pipeline(dark_frame, low_light=True)
        assert result.shape == dark_frame.shape
        assert np.mean(result) > np.mean(dark_frame)
