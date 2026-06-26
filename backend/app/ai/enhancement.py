"""
Module 1: Image Enhancement Engine
===================================
Improves CCTV frame quality before analysis using classical
image processing techniques from OpenCV.
"""

import cv2
import numpy as np
from typing import Optional, Tuple


class FrameEnhancer:
    """
    Applies a suite of image enhancement techniques to improve
    low-quality CCTV frames for downstream crowd analysis.
    """

    def __init__(
        self,
        clahe_clip_limit: float = 3.0,
        clahe_grid_size: Tuple[int, int] = (8, 8),
        gaussian_ksize: int = 5,
        median_ksize: int = 5,
        bilateral_d: int = 9,
        bilateral_sigma_color: float = 75.0,
        bilateral_sigma_space: float = 75.0,
        gamma: float = 1.5,
    ):
        self.clahe_clip_limit = clahe_clip_limit
        self.clahe_grid_size = clahe_grid_size
        self.gaussian_ksize = gaussian_ksize
        self.median_ksize = median_ksize
        self.bilateral_d = bilateral_d
        self.bilateral_sigma_color = bilateral_sigma_color
        self.bilateral_sigma_space = bilateral_sigma_space
        self.gamma = gamma

        # Pre-build the CLAHE object
        self._clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.clahe_grid_size,
        )

        # Pre-build the sharpening kernel
        self._sharpen_kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ], dtype=np.float32)

    # ── Individual Enhancement Methods ───────────────────────────

    def histogram_equalization(self, frame: np.ndarray) -> np.ndarray:
        """
        Apply global histogram equalization.
        Improves overall contrast but can over-amplify noise.
        """
        if len(frame.shape) == 3:
            # Convert to YCrCb, equalize the Y (luminance) channel
            ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        else:
            return cv2.equalizeHist(frame)

    def clahe(self, frame: np.ndarray) -> np.ndarray:
        """
        Apply Contrast Limited Adaptive Histogram Equalization.
        Better than global equalization — avoids over-amplification.
        """
        if len(frame.shape) == 3:
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            lab[:, :, 0] = self._clahe.apply(lab[:, :, 0])
            return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            return self._clahe.apply(frame)

    def gaussian_filter(self, frame: np.ndarray, ksize: Optional[int] = None) -> np.ndarray:
        """
        Apply Gaussian blur for general noise reduction.
        Smooths the image while preserving edges somewhat.
        """
        k = ksize or self.gaussian_ksize
        return cv2.GaussianBlur(frame, (k, k), 0)

    def median_filter(self, frame: np.ndarray, ksize: Optional[int] = None) -> np.ndarray:
        """
        Apply median filter — excellent for salt-and-pepper noise.
        Preserves edges better than Gaussian blur.
        """
        k = ksize or self.median_ksize
        return cv2.medianBlur(frame, k)

    def bilateral_filter(self, frame: np.ndarray) -> np.ndarray:
        """
        Apply bilateral filter — edge-preserving smoothing.
        Smooths flat regions while keeping edges sharp.
        """
        return cv2.bilateralFilter(
            frame,
            self.bilateral_d,
            self.bilateral_sigma_color,
            self.bilateral_sigma_space,
        )

    def sharpen(self, frame: np.ndarray) -> np.ndarray:
        """
        Apply sharpening using an unsharp mask kernel.
        Enhances edges and fine details.
        """
        return cv2.filter2D(frame, -1, self._sharpen_kernel)

    def low_light_enhance(self, frame: np.ndarray) -> np.ndarray:
        """
        Enhance low-light / dark frames using gamma correction + CLAHE.
        """
        # Gamma correction to brighten dark regions
        inv_gamma = 1.0 / self.gamma
        table = np.array([
            ((i / 255.0) ** inv_gamma) * 255
            for i in np.arange(0, 256)
        ]).astype("uint8")
        gamma_corrected = cv2.LUT(frame, table)

        # Follow with CLAHE for local contrast
        return self.clahe(gamma_corrected)

    def contrast_enhancement(self, frame: np.ndarray, alpha: float = 1.3, beta: int = 20) -> np.ndarray:
        """
        Simple linear contrast/brightness adjustment.
        output = alpha * input + beta
        """
        return cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

    def denoise(self, frame: np.ndarray, h: float = 10.0) -> np.ndarray:
        """
        Apply Non-Local Means Denoising — high quality but slower.
        Use for critical frames, not real-time processing.
        """
        if len(frame.shape) == 3:
            return cv2.fastNlMeansDenoisingColored(frame, None, h, h, 7, 21)
        else:
            return cv2.fastNlMeansDenoising(frame, None, h, 7, 21)

    # ── Full Enhancement Pipeline ────────────────────────────────

    def enhance_pipeline(self, frame: np.ndarray, low_light: bool = False) -> np.ndarray:
        """
        Full enhancement pipeline optimized for CCTV crowd analysis:
        1. Noise reduction (bilateral — edge-preserving)
        2. Low-light enhancement (if detected/flagged)
        3. Contrast enhancement (CLAHE)
        4. Sharpening

        Args:
            frame: Input BGR frame from camera
            low_light: If True, apply low-light enhancement

        Returns:
            Enhanced BGR frame
        """
        # Step 1: Noise reduction (bilateral preserves edges)
        enhanced = self.bilateral_filter(frame)

        # Step 2: Low-light enhancement if needed
        if low_light or self._is_dark(frame):
            enhanced = self.low_light_enhance(enhanced)
        else:
            # Step 3: Standard CLAHE contrast enhancement
            enhanced = self.clahe(enhanced)

        # Step 4: Gentle sharpening
        enhanced = self.sharpen(enhanced)

        return enhanced

    def _is_dark(self, frame: np.ndarray, threshold: float = 60.0) -> bool:
        """Detect if a frame is low-light based on average brightness."""
        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame
        return float(np.mean(gray)) < threshold
