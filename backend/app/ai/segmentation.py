"""
Module 2: Crowd Segmentation Engine
=====================================
Separates crowd regions from background using classical
segmentation techniques from OpenCV.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any


class CrowdSegmentor:
    """
    Applies multiple segmentation algorithms to extract crowd
    regions, contours, and binary masks from enhanced frames.
    """

    def __init__(
        self,
        adaptive_block_size: int = 11,
        adaptive_c: int = 2,
        canny_low: int = 50,
        canny_high: int = 150,
        min_contour_area: int = 500,
        morph_kernel_size: int = 5,
    ):
        self.adaptive_block_size = adaptive_block_size
        self.adaptive_c = adaptive_c
        self.canny_low = canny_low
        self.canny_high = canny_high
        self.min_contour_area = min_contour_area
        self.morph_kernel_size = morph_kernel_size

        self._morph_kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (morph_kernel_size, morph_kernel_size)
        )

        # Background subtractor for motion-based segmentation
        self._bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=True
        )

    # ── Thresholding Methods ─────────────────────────────────────

    def adaptive_threshold(self, gray: np.ndarray) -> np.ndarray:
        """
        Adaptive thresholding — handles varying illumination across the frame.
        """
        return cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            self.adaptive_block_size,
            self.adaptive_c,
        )

    def otsu_threshold(self, gray: np.ndarray) -> np.ndarray:
        """
        Otsu's automatic thresholding — finds optimal threshold value.
        """
        # Apply Gaussian blur before Otsu for better results
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        return binary

    # ── Edge Detection ───────────────────────────────────────────

    def canny_edges(self, gray: np.ndarray, low: Optional[int] = None, high: Optional[int] = None) -> np.ndarray:
        """
        Canny edge detection for crowd boundary identification.
        """
        l = low or self.canny_low
        h = high or self.canny_high
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        return cv2.Canny(blurred, l, h)

    # ── Advanced Segmentation ────────────────────────────────────

    def watershed_segment(self, frame: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Marker-based watershed segmentation for separating touching crowd blobs.

        Returns:
            (markers, colored_result) - Marker labels and visualization
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Noise removal with morphological opening
        opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, self._morph_kernel, iterations=2)

        # Sure background area (dilation)
        sure_bg = cv2.dilate(opening, self._morph_kernel, iterations=3)

        # Sure foreground area (distance transform)
        dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
        _, sure_fg = cv2.threshold(dist_transform, 0.5 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)

        # Unknown region
        unknown = cv2.subtract(sure_bg, sure_fg)

        # Marker labelling
        _, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0

        # Watershed
        markers = cv2.watershed(frame, markers)

        return markers, frame.copy()

    def region_growing(self, gray: np.ndarray, seeds: Optional[List[Tuple[int, int]]] = None,
                       threshold: int = 20) -> np.ndarray:
        """
        Simple region growing from seed points using flood fill.
        If no seeds provided, auto-detect seed points from high-intensity regions.
        """
        mask = np.zeros_like(gray)

        if seeds is None:
            # Auto-detect seeds: use points where intensity is above mean
            mean_val = np.mean(gray)
            high_regions = gray > (mean_val * 0.6)
            # Sample seed points from high regions
            ys, xs = np.where(high_regions)
            if len(ys) > 0:
                step = max(1, len(ys) // 50)  # Limit to ~50 seeds
                seeds = list(zip(xs[::step].tolist(), ys[::step].tolist()))
            else:
                return mask

        h, w = gray.shape
        flood_mask = np.zeros((h + 2, w + 2), np.uint8)

        for (x, y) in seeds:
            if 0 <= x < w and 0 <= y < h and mask[y, x] == 0:
                cv2.floodFill(
                    gray.copy(), flood_mask, (x, y),
                    255, threshold, threshold,
                    cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE
                )

        # Extract the flood fill result
        result = flood_mask[1:-1, 1:-1] * 255
        return result

    # ── Contour Detection ────────────────────────────────────────

    def find_contours(self, binary: np.ndarray) -> List[np.ndarray]:
        """
        Find and filter contours by minimum area.
        Returns contours sorted by area (largest first).
        """
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        # Filter by minimum area to remove noise
        filtered = [c for c in contours if cv2.contourArea(c) >= self.min_contour_area]
        # Sort by area descending
        filtered.sort(key=cv2.contourArea, reverse=True)
        return filtered

    # ── Morphological Operations ─────────────────────────────────

    def morphological_ops(self, binary: np.ndarray) -> np.ndarray:
        """
        Apply morphological operations to clean up the binary mask:
        1. Opening (remove small noise)
        2. Closing (fill small holes)
        3. Dilation (expand crowd regions slightly)
        """
        # Opening: erode then dilate — removes small noise
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, self._morph_kernel, iterations=2)
        # Closing: dilate then erode — fills small holes
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, self._morph_kernel, iterations=2)
        # Slight dilation to connect nearby regions
        cleaned = cv2.dilate(cleaned, self._morph_kernel, iterations=1)
        return cleaned

    # ── Boundary Extraction ──────────────────────────────────────

    def extract_boundaries(self, contours: List[np.ndarray], shape: Tuple[int, int]) -> np.ndarray:
        """
        Draw boundary outlines from contours on a blank mask.
        """
        boundary_mask = np.zeros(shape[:2], dtype=np.uint8)
        cv2.drawContours(boundary_mask, contours, -1, 255, 2)
        return boundary_mask

    # ── Background Subtraction ───────────────────────────────────

    def background_subtract(self, frame: np.ndarray) -> np.ndarray:
        """
        Use MOG2 background subtraction for motion-based crowd detection.
        Effective for static camera feeds.
        """
        fg_mask = self._bg_subtractor.apply(frame)
        # Remove shadows (shadows are marked as 127 in MOG2)
        _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        # Clean up with morphological ops
        fg_mask = self.morphological_ops(fg_mask)
        return fg_mask

    # ── Full Segmentation Pipeline ───────────────────────────────

    def segment_pipeline(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Full segmentation pipeline combining multiple techniques:
        1. Convert to grayscale
        2. Background subtraction (motion-based)
        3. Otsu thresholding
        4. Combine masks
        5. Morphological cleanup
        6. Contour detection
        7. Boundary extraction

        Returns:
            Dictionary with:
            - binary_mask: Final binary crowd mask
            - contours: List of crowd contours
            - boundaries: Boundary visualization mask
            - crowd_regions: List of bounding rects for crowd blobs
            - crowd_area: Total crowd pixel area
            - crowd_count_estimate: Estimated person count (heuristic)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Method 1: Background subtraction
        bg_mask = self.background_subtract(frame)

        # Method 2: Otsu thresholding
        otsu_mask = self.otsu_threshold(gray)

        # Combine: union of both methods
        combined = cv2.bitwise_or(bg_mask, otsu_mask)

        # Morphological cleanup
        cleaned = self.morphological_ops(combined)

        # Edge-based refinement
        edges = self.canny_edges(gray)
        edges_dilated = cv2.dilate(edges, self._morph_kernel, iterations=1)

        # Combine cleaned mask with dilated edges
        final_mask = cv2.bitwise_or(cleaned, edges_dilated)
        final_mask = self.morphological_ops(final_mask)

        # Find contours
        contours = self.find_contours(final_mask)

        # Extract boundaries
        boundaries = self.extract_boundaries(contours, frame.shape)

        # Extract crowd regions as bounding rectangles
        crowd_regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            crowd_regions.append({
                "bbox": [int(x), int(y), int(w), int(h)],
                "area": float(area),
                "centroid": [int(x + w // 2), int(y + h // 2)],
            })

        # Total crowd area
        crowd_area = float(np.sum(final_mask > 0))
        total_area = float(final_mask.shape[0] * final_mask.shape[1])
        crowd_pct = (crowd_area / total_area * 100) if total_area > 0 else 0

        # Heuristic person count: estimate based on average person area
        avg_person_area = 2000.0  # pixels — rough estimate for CCTV
        crowd_count_estimate = max(1, int(crowd_area / avg_person_area)) if crowd_area > 0 else 0

        return {
            "binary_mask": final_mask,
            "contours": contours,
            "boundaries": boundaries,
            "crowd_regions": crowd_regions,
            "crowd_area": crowd_area,
            "crowd_area_pct": crowd_pct,
            "crowd_count_estimate": crowd_count_estimate,
        }
