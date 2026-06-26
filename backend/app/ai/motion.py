"""
Module 4: Motion Intelligence
===============================
Understands crowd movement using Optical Flow algorithms (Lucas-Kanade
and Farneback) to detect abnormal motion patterns.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from collections import deque


class MotionAnalyzer:
    """
    Analyzes crowd motion using optical flow, detecting speed, direction,
    opposing movement, sudden running, dispersion, convergence, and chaos.
    """

    def __init__(
        self,
        max_corners: int = 200,
        quality_level: float = 0.3,
        min_distance: int = 7,
        block_size: int = 7,
        lk_win_size: Tuple[int, int] = (15, 15),
        lk_max_level: int = 2,
        farneback_pyr_scale: float = 0.5,
        farneback_levels: int = 3,
        farneback_winsize: int = 15,
        farneback_iterations: int = 3,
        farneback_poly_n: int = 5,
        farneback_poly_sigma: float = 1.2,
        speed_history_size: int = 30,
        sudden_speed_factor: float = 3.0,
        chaos_direction_std_threshold: float = 60.0,
    ):
        # Lucas-Kanade parameters
        self.feature_params = dict(
            maxCorners=max_corners,
            qualityLevel=quality_level,
            minDistance=min_distance,
            blockSize=block_size,
        )
        self.lk_params = dict(
            winSize=lk_win_size,
            maxLevel=lk_max_level,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03),
        )

        # Farneback parameters
        self.farneback_params = dict(
            pyr_scale=farneback_pyr_scale,
            levels=farneback_levels,
            winsize=farneback_winsize,
            iterations=farneback_iterations,
            poly_n=farneback_poly_n,
            poly_sigma=farneback_poly_sigma,
            flags=0,
        )

        # Anomaly detection parameters
        self.speed_history = deque(maxlen=speed_history_size)
        self.flow_history = deque(maxlen=speed_history_size)
        self.sudden_speed_factor = sudden_speed_factor
        self.chaos_direction_std_threshold = chaos_direction_std_threshold

    # ── Optical Flow Methods ─────────────────────────────────────

    def lucas_kanade(
        self,
        prev_gray: np.ndarray,
        curr_gray: np.ndarray,
        prev_points: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Sparse optical flow using Lucas-Kanade pyramid method.
        Tracks specific feature points between consecutive frames.

        Returns:
            (good_new, good_old, status) - matched point pairs and status
        """
        if prev_points is None or len(prev_points) < 10:
            prev_points = cv2.goodFeaturesToTrack(prev_gray, mask=None, **self.feature_params)

        if prev_points is None or len(prev_points) == 0:
            return np.array([]), np.array([]), np.array([])

        next_points, status, err = cv2.calcOpticalFlowPyrLK(
            prev_gray, curr_gray, prev_points, None, **self.lk_params
        )

        if next_points is None:
            return np.array([]), np.array([]), np.array([])

        # Select good points
        status = status.flatten()
        good_new = next_points[status == 1]
        good_old = prev_points[status == 1]

        return good_new, good_old, status

    def farneback(self, prev_gray: np.ndarray, curr_gray: np.ndarray) -> np.ndarray:
        """
        Dense optical flow using Farneback method.
        Computes flow vectors for every pixel.

        Returns:
            flow: (H, W, 2) array of (dx, dy) flow vectors
        """
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, curr_gray, None, **self.farneback_params
        )
        return flow

    # ── Motion Vector Analysis ───────────────────────────────────

    def compute_vectors(self, flow: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert flow field to magnitude and angle.

        Returns:
            (magnitude, angle_degrees)
        """
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        ang_degrees = ang * 180 / np.pi
        return mag, ang_degrees

    def compute_speed(self, flow: np.ndarray, fps: float = 30.0) -> Dict[str, float]:
        """
        Compute speed statistics from flow field.
        """
        mag, _ = self.compute_vectors(flow)

        # Filter out near-zero flow (background noise)
        significant = mag[mag > 1.0]

        if len(significant) == 0:
            return {"avg_speed": 0.0, "max_speed": 0.0, "speed_variance": 0.0}

        return {
            "avg_speed": round(float(np.mean(significant)), 2),
            "max_speed": round(float(np.max(significant)), 2),
            "speed_variance": round(float(np.var(significant)), 2),
        }

    def compute_direction(self, flow: np.ndarray) -> Dict[str, float]:
        """
        Compute the dominant direction of crowd movement.
        """
        mag, ang = self.compute_vectors(flow)

        # Weight direction by magnitude (ignore stationary pixels)
        mask = mag > 1.0
        if np.sum(mask) == 0:
            return {"avg_direction": 0.0, "direction_std": 0.0, "flow_consistency": 100.0}

        weighted_angles = ang[mask]

        # Circular mean for angles
        sin_sum = np.mean(np.sin(np.radians(weighted_angles)))
        cos_sum = np.mean(np.cos(np.radians(weighted_angles)))
        avg_direction = float(np.degrees(np.arctan2(sin_sum, cos_sum))) % 360

        # Direction standard deviation (measure of consistency)
        direction_std = float(np.std(weighted_angles))

        # Flow consistency: inverse of direction variance (0-100)
        flow_consistency = max(0, min(100, 100 - direction_std))

        return {
            "avg_direction": round(avg_direction, 2),
            "direction_std": round(direction_std, 2),
            "flow_consistency": round(flow_consistency, 2),
        }

    # ── Anomaly Detection ────────────────────────────────────────

    def detect_opposing_movement(self, flow: np.ndarray, grid_rows: int = 4, grid_cols: int = 4) -> Dict[str, Any]:
        """
        Detect opposing/counter-flow movement in adjacent zones.
        This indicates potential collision or stampede risk.
        """
        h, w = flow.shape[:2]
        zone_h, zone_w = h // grid_rows, w // grid_cols

        zone_directions = {}
        for r in range(grid_rows):
            for c in range(grid_cols):
                zone_flow = flow[r*zone_h:(r+1)*zone_h, c*zone_w:(c+1)*zone_w]
                mag, ang = cv2.cartToPolar(zone_flow[..., 0], zone_flow[..., 1])
                mask = mag > 1.0
                if np.sum(mask) > 0:
                    avg_dx = float(np.mean(zone_flow[..., 0][mask]))
                    avg_dy = float(np.mean(zone_flow[..., 1][mask]))
                    zone_directions[f"zone_{r}_{c}"] = (avg_dx, avg_dy)

        # Check adjacent zone pairs for opposing directions
        opposing_pairs = []
        for r in range(grid_rows):
            for c in range(grid_cols):
                key = f"zone_{r}_{c}"
                if key not in zone_directions:
                    continue

                dx1, dy1 = zone_directions[key]

                # Check right neighbor
                right_key = f"zone_{r}_{c+1}"
                if right_key in zone_directions:
                    dx2, dy2 = zone_directions[right_key]
                    dot = dx1 * dx2 + dy1 * dy2
                    if dot < -0.5:  # Opposing directions
                        opposing_pairs.append((key, right_key))

                # Check bottom neighbor
                bottom_key = f"zone_{r+1}_{c}"
                if bottom_key in zone_directions:
                    dx2, dy2 = zone_directions[bottom_key]
                    dot = dx1 * dx2 + dy1 * dy2
                    if dot < -0.5:
                        opposing_pairs.append((key, bottom_key))

        score = min(100, len(opposing_pairs) * 20)
        return {
            "detected": len(opposing_pairs) > 0,
            "pairs": opposing_pairs,
            "score": score,
        }

    def detect_sudden_running(self, speed: float) -> Dict[str, Any]:
        """
        Detect sudden speed spikes indicating panic/running.
        Compares current speed to the moving average.
        """
        self.speed_history.append(speed)

        if len(self.speed_history) < 5:
            return {"detected": False, "score": 0.0, "speed_ratio": 1.0}

        # Moving average (excluding latest)
        history = list(self.speed_history)[:-1]
        avg_speed = np.mean(history) if len(history) > 0 else 1.0
        avg_speed = max(avg_speed, 0.1)  # Prevent division by zero

        speed_ratio = speed / avg_speed

        detected = speed_ratio > self.sudden_speed_factor
        score = min(100, max(0, (speed_ratio - 1) * 30))

        return {
            "detected": detected,
            "score": round(score, 2),
            "speed_ratio": round(speed_ratio, 2),
            "current_speed": round(speed, 2),
            "avg_speed": round(avg_speed, 2),
        }

    def detect_dispersion(self, flow: np.ndarray) -> Dict[str, Any]:
        """
        Detect crowd dispersion: outward radial flow from center.
        Indicates people running away from a central point.
        """
        h, w = flow.shape[:2]
        cx, cy = w / 2, h / 2

        # For each pixel, compute the angle of flow vs angle from center
        y_coords, x_coords = np.mgrid[0:h, 0:w]
        dx_from_center = x_coords - cx
        dy_from_center = y_coords - cy

        # Normalize
        dist = np.sqrt(dx_from_center**2 + dy_from_center**2)
        dist[dist == 0] = 1
        norm_dx = dx_from_center / dist
        norm_dy = dy_from_center / dist

        # Flow vectors
        flow_dx = flow[..., 0]
        flow_dy = flow[..., 1]
        flow_mag = np.sqrt(flow_dx**2 + flow_dy**2)

        # Dot product: positive = outward, negative = inward
        mask = flow_mag > 1.0
        if np.sum(mask) < 100:
            return {"detected": False, "score": 0.0}

        dot = (flow_dx * norm_dx + flow_dy * norm_dy)[mask]
        dispersion_ratio = float(np.mean(dot > 0))

        detected = dispersion_ratio > 0.7
        score = min(100, max(0, (dispersion_ratio - 0.5) * 200))

        return {
            "detected": detected,
            "score": round(score, 2),
            "dispersion_ratio": round(dispersion_ratio, 2),
        }

    def detect_convergence(self, flow: np.ndarray) -> Dict[str, Any]:
        """
        Detect crowd convergence: inward radial flow toward center.
        Indicates people crowding toward a central point.
        """
        h, w = flow.shape[:2]
        cx, cy = w / 2, h / 2

        y_coords, x_coords = np.mgrid[0:h, 0:w]
        dx_from_center = x_coords - cx
        dy_from_center = y_coords - cy

        dist = np.sqrt(dx_from_center**2 + dy_from_center**2)
        dist[dist == 0] = 1
        norm_dx = dx_from_center / dist
        norm_dy = dy_from_center / dist

        flow_dx = flow[..., 0]
        flow_dy = flow[..., 1]
        flow_mag = np.sqrt(flow_dx**2 + flow_dy**2)

        mask = flow_mag > 1.0
        if np.sum(mask) < 100:
            return {"detected": False, "score": 0.0}

        # Negative dot = inward
        dot = (flow_dx * norm_dx + flow_dy * norm_dy)[mask]
        convergence_ratio = float(np.mean(dot < 0))

        detected = convergence_ratio > 0.7
        score = min(100, max(0, (convergence_ratio - 0.5) * 200))

        return {
            "detected": detected,
            "score": round(score, 2),
            "convergence_ratio": round(convergence_ratio, 2),
        }

    def detect_chaos(self, flow: np.ndarray) -> Dict[str, Any]:
        """
        Detect chaotic movement: high variance in direction vectors.
        Indicates panic with no coordinated direction.
        """
        mag, ang = self.compute_vectors(flow)
        mask = mag > 1.0

        if np.sum(mask) < 100:
            return {"detected": False, "score": 0.0, "direction_std": 0.0}

        direction_std = float(np.std(ang[mask]))
        detected = direction_std > self.chaos_direction_std_threshold
        score = min(100, max(0, (direction_std - 30) * 1.5))

        return {
            "detected": detected,
            "score": round(score, 2),
            "direction_std": round(direction_std, 2),
        }

    # ── Visualization ────────────────────────────────────────────

    def visualize_flow(self, frame: np.ndarray, flow: np.ndarray, step: int = 16) -> np.ndarray:
        """
        Draw motion vectors on the frame as arrows.
        """
        vis = frame.copy()
        h, w = flow.shape[:2]

        # Draw flow arrows
        y, x = np.mgrid[step//2:h:step, step//2:w:step].reshape(2, -1).astype(int)
        fx = flow[y, x, 0]
        fy = flow[y, x, 1]

        # Filter out small movements
        mag = np.sqrt(fx**2 + fy**2)
        mask = mag > 1.0

        for i in range(len(x)):
            if mask[i]:
                pt1 = (x[i], y[i])
                pt2 = (int(x[i] + fx[i] * 3), int(y[i] + fy[i] * 3))

                # Color based on speed
                speed = mag[i]
                if speed > 10:
                    color = (0, 0, 255)     # Red = fast
                elif speed > 5:
                    color = (0, 165, 255)   # Orange = medium
                else:
                    color = (0, 255, 0)     # Green = slow

                cv2.arrowedLine(vis, pt1, pt2, color, 1, tipLength=0.3)

        return vis

    def visualize_flow_hsv(self, flow: np.ndarray) -> np.ndarray:
        """
        Visualize dense flow as an HSV image.
        Hue = direction, Saturation = full, Value = magnitude.
        """
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])

        hsv = np.zeros((*flow.shape[:2], 3), dtype=np.uint8)
        hsv[..., 0] = ang * 180 / np.pi / 2  # Hue
        hsv[..., 1] = 255  # Saturation
        hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # ── Full Analysis Pipeline ───────────────────────────────────

    def analyze(
        self,
        prev_gray: np.ndarray,
        curr_gray: np.ndarray,
        prev_points: Optional[np.ndarray] = None,
        frame: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """
        Full motion analysis pipeline.

        Returns:
            Dictionary with speed, direction, anomalies, visualizations
        """
        # Dense optical flow (Farneback)
        flow = self.farneback(prev_gray, curr_gray)
        self.flow_history.append(flow)

        # Sparse optical flow (Lucas-Kanade)
        good_new, good_old, lk_status = self.lucas_kanade(prev_gray, curr_gray, prev_points)

        # Speed analysis
        speed_data = self.compute_speed(flow)

        # Direction analysis
        direction_data = self.compute_direction(flow)

        # Anomaly detection
        opposing = self.detect_opposing_movement(flow)
        running = self.detect_sudden_running(speed_data["avg_speed"])
        dispersion = self.detect_dispersion(flow)
        convergence = self.detect_convergence(flow)
        chaos = self.detect_chaos(flow)

        # Determine primary anomaly
        anomalies = {
            "opposing_movement": opposing,
            "sudden_running": running,
            "crowd_dispersion": dispersion,
            "crowd_convergence": convergence,
            "chaotic_movement": chaos,
        }

        # Find the highest-scoring anomaly
        max_anomaly_type = "none"
        max_anomaly_score = 0.0
        for atype, adata in anomalies.items():
            if adata["score"] > max_anomaly_score:
                max_anomaly_score = adata["score"]
                max_anomaly_type = atype

        # Visualizations
        motion_vis = None
        flow_hsv = None
        if frame is not None:
            motion_vis = self.visualize_flow(frame, flow)
            flow_hsv = self.visualize_flow_hsv(flow)

        # New tracking points for next iteration
        new_points = None
        if len(good_new) > 10:
            new_points = good_new.reshape(-1, 1, 2)
        else:
            new_points = cv2.goodFeaturesToTrack(curr_gray, mask=None, **self.feature_params)

        return {
            "flow": flow,
            "speed": speed_data,
            "direction": direction_data,
            "anomalies": anomalies,
            "primary_anomaly_type": max_anomaly_type,
            "primary_anomaly_score": round(max_anomaly_score, 2),
            "motion_visualization": motion_vis,
            "flow_hsv": flow_hsv,
            "tracking_points": new_points,
        }
