"""
Module 3: Crowd Density Analysis
==================================
Measures crowd concentration by dividing the frame into zones,
estimating occupied area, computing density scores, and generating heatmaps.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Any, Optional


class DensityAnalyzer:
    """
    Analyzes crowd density across configurable zones, generates
    heatmaps, and identifies congestion hotspots.
    """

    # Density level thresholds (percentage of zone occupied)
    DENSITY_LEVELS = {
        "low": (0, 25),
        "medium": (25, 50),
        "high": (50, 75),
        "critical": (75, 100),
    }

    # Heatmap color scale (BGR)
    COLORS = {
        "low": (0, 255, 0),       # Green
        "medium": (0, 255, 255),   # Yellow
        "high": (0, 128, 255),     # Orange
        "critical": (0, 0, 255),   # Red
    }

    def __init__(self, grid_rows: int = 4, grid_cols: int = 4, hotspot_threshold: float = 70.0):
        self.grid_rows = grid_rows
        self.grid_cols = grid_cols
        self.hotspot_threshold = hotspot_threshold

    # ── Zone Division ────────────────────────────────────────────

    def divide_zones(self, frame_shape: Tuple[int, int, ...]) -> Dict[str, Dict[str, int]]:
        """
        Divide the frame into a grid of zones.

        Returns:
            Dictionary of zone_id -> {x, y, w, h}
        """
        h, w = frame_shape[:2]
        zone_h = h // self.grid_rows
        zone_w = w // self.grid_cols

        zones = {}
        for row in range(self.grid_rows):
            for col in range(self.grid_cols):
                zone_id = f"zone_{row}_{col}"
                zones[zone_id] = {
                    "x": col * zone_w,
                    "y": row * zone_h,
                    "w": zone_w,
                    "h": zone_h,
                    "row": row,
                    "col": col,
                }
        return zones

    # ── Per-Zone Analysis ────────────────────────────────────────

    def count_per_zone(
        self, contours: List[np.ndarray], zones: Dict[str, Dict[str, int]]
    ) -> Dict[str, int]:
        """
        Count crowd blobs whose centroids fall in each zone.
        """
        zone_counts = {zone_id: 0 for zone_id in zones}

        for contour in contours:
            M = cv2.moments(contour)
            if M["m00"] == 0:
                continue
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])

            for zone_id, z in zones.items():
                if z["x"] <= cx < z["x"] + z["w"] and z["y"] <= cy < z["y"] + z["h"]:
                    zone_counts[zone_id] += 1
                    break

        return zone_counts

    def estimate_occupied_area(
        self, mask: np.ndarray, zones: Dict[str, Dict[str, int]]
    ) -> Dict[str, float]:
        """
        Calculate the percentage of each zone occupied by crowd pixels.
        """
        zone_occupancy = {}

        for zone_id, z in zones.items():
            zone_region = mask[z["y"]:z["y"] + z["h"], z["x"]:z["x"] + z["w"]]
            total_pixels = zone_region.shape[0] * zone_region.shape[1]
            if total_pixels == 0:
                zone_occupancy[zone_id] = 0.0
                continue
            occupied = float(np.sum(zone_region > 0))
            zone_occupancy[zone_id] = round((occupied / total_pixels) * 100, 2)

        return zone_occupancy

    # ── Density Scoring ──────────────────────────────────────────

    def compute_density_score(self, zone_occupancy: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        """
        Score each zone and classify density level.

        Returns:
            zone_id -> {score, level, color}
        """
        zone_scores = {}
        for zone_id, occupancy in zone_occupancy.items():
            score = min(100.0, max(0.0, occupancy))
            level = self._classify_density(score)
            zone_scores[zone_id] = {
                "score": round(score, 2),
                "level": level,
                "color": self.COLORS[level],
            }
        return zone_scores

    def _classify_density(self, score: float) -> str:
        """Classify a density score into a level."""
        for level, (low, high) in self.DENSITY_LEVELS.items():
            if low <= score < high:
                return level
        return "critical"

    # ── Heatmap Generation ───────────────────────────────────────

    def generate_heatmap(
        self,
        zone_scores: Dict[str, Dict[str, Any]],
        frame_shape: Tuple[int, int, ...],
        zones: Dict[str, Dict[str, int]],
        alpha: float = 0.4,
    ) -> np.ndarray:
        """
        Generate a color-coded density heatmap overlay.

        Args:
            zone_scores: Per-zone density scores with colors
            frame_shape: Original frame shape for sizing
            zones: Zone geometry
            alpha: Blend factor for the overlay

        Returns:
            BGR heatmap image (same size as frame)
        """
        heatmap = np.zeros((frame_shape[0], frame_shape[1], 3), dtype=np.uint8)

        for zone_id, score_data in zone_scores.items():
            z = zones[zone_id]
            color = score_data["color"]
            # Fill zone with density-proportional color
            intensity = score_data["score"] / 100.0
            zone_color = tuple(int(c * intensity) for c in color)
            heatmap[z["y"]:z["y"] + z["h"], z["x"]:z["x"] + z["w"]] = zone_color

        # Apply Gaussian blur for smooth transitions
        heatmap = cv2.GaussianBlur(heatmap, (31, 31), 0)

        return heatmap

    def overlay_heatmap(
        self, frame: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4
    ) -> np.ndarray:
        """Blend heatmap onto the original frame."""
        return cv2.addWeighted(frame, 1 - alpha, heatmap, alpha, 0)

    # ── Hotspot Detection ────────────────────────────────────────

    def detect_hotspots(
        self, zone_scores: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Flag zones where density exceeds the hotspot threshold.
        """
        hotspots = []
        for zone_id, score_data in zone_scores.items():
            if score_data["score"] >= self.hotspot_threshold:
                hotspots.append({
                    "zone": zone_id,
                    "score": score_data["score"],
                    "level": score_data["level"],
                })
        # Sort by severity
        hotspots.sort(key=lambda x: x["score"], reverse=True)
        return hotspots

    # ── Congestion Score ─────────────────────────────────────────

    def compute_congestion_score(self, zone_scores: Dict[str, Dict[str, Any]]) -> float:
        """
        Compute an overall congestion score based on:
        - Number of high/critical zones
        - Spatial clustering of high-density zones
        """
        if not zone_scores:
            return 0.0

        scores = [s["score"] for s in zone_scores.values()]
        high_count = sum(1 for s in scores if s >= 50)
        total_zones = len(scores)

        # Base: average of all zone scores
        avg_score = np.mean(scores)

        # Penalty: proportion of zones at high/critical
        high_ratio = high_count / total_zones if total_zones > 0 else 0

        # Congestion = weighted combination
        congestion = (0.6 * avg_score) + (0.4 * high_ratio * 100)
        return round(min(100.0, congestion), 2)

    # ── Full Analysis Pipeline ───────────────────────────────────

    def analyze(
        self,
        frame: np.ndarray,
        mask: np.ndarray,
        contours: List[np.ndarray],
        crowd_count_estimate: int = 0,
    ) -> Dict[str, Any]:
        """
        Full density analysis pipeline.

        Args:
            frame: Original BGR frame
            mask: Binary crowd mask from segmentation
            contours: Crowd contours from segmentation
            crowd_count_estimate: Estimated person count

        Returns:
            Dictionary with zone_scores, heatmap, hotspots, statistics
        """
        zones = self.divide_zones(frame.shape)
        zone_counts = self.count_per_zone(contours, zones)
        zone_occupancy = self.estimate_occupied_area(mask, zones)
        zone_scores = self.compute_density_score(zone_occupancy)

        # Overall density
        all_scores = [s["score"] for s in zone_scores.values()]
        overall_density = round(float(np.mean(all_scores)), 2) if all_scores else 0.0
        overall_level = self._classify_density(overall_density)

        # Heatmap
        heatmap = self.generate_heatmap(zone_scores, frame.shape, zones)
        heatmap_overlay = self.overlay_heatmap(frame, heatmap)

        # Hotspots
        hotspots = self.detect_hotspots(zone_scores)

        # Congestion
        congestion_score = self.compute_congestion_score(zone_scores)

        # Occupied area percentage
        total_mask_pixels = mask.shape[0] * mask.shape[1]
        occupied_pct = round(float(np.sum(mask > 0)) / total_mask_pixels * 100, 2)

        return {
            "zones": zones,
            "zone_scores": {k: {"score": v["score"], "level": v["level"]} for k, v in zone_scores.items()},
            "zone_counts": zone_counts,
            "overall_density": overall_density,
            "overall_level": overall_level,
            "congestion_score": congestion_score,
            "heatmap": heatmap,
            "heatmap_overlay": heatmap_overlay,
            "hotspots": hotspots,
            "crowd_count_estimate": crowd_count_estimate,
            "occupied_area_pct": occupied_pct,
        }
