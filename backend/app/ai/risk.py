"""
Module 5: Risk Prediction Engine
===================================
Predicts crowd danger levels using the weighted risk formula
combining density, congestion, motion anomaly, and speed variance.
"""

import numpy as np
from typing import Dict, Any, Optional


class RiskPredictor:
    """
    Computes risk scores using:
    Risk = (0.35 × Density) + (0.25 × Congestion) + (0.25 × Motion Anomaly) + (0.15 × Speed Variance)

    Risk Levels:
        Level 1 (Safe):     0 - 25
        Level 2 (Watch):    25 - 50
        Level 3 (Warning):  50 - 75
        Level 4 (Critical): 75 - 100
    """

    WEIGHTS = {
        "density": 0.35,
        "congestion": 0.25,
        "motion_anomaly": 0.25,
        "speed_variance": 0.15,
    }

    RISK_LEVELS = {
        "safe": (0, 25),
        "watch": (25, 50),
        "warning": (50, 75),
        "critical": (75, 100),
    }

    RISK_LEVEL_LABELS = {
        "safe": "Level 1: Safe",
        "watch": "Level 2: Watch",
        "warning": "Level 3: Warning",
        "critical": "Level 4: Critical",
    }

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """
        Initialize with optional custom weights.
        """
        if weights:
            total = sum(weights.values())
            # Normalize to sum to 1
            self.weights = {k: v / total for k, v in weights.items()}
        else:
            self.weights = self.WEIGHTS.copy()

    def compute_risk(
        self,
        density_score: float,
        congestion_score: float,
        motion_anomaly_score: float,
        speed_variance: float,
    ) -> float:
        """
        Compute the overall risk percentage.

        All inputs should be on a 0-100 scale.

        Returns:
            Risk percentage (0-100)
        """
        # Normalize speed variance to 0-100 scale
        normalized_speed = self._normalize_speed_variance(speed_variance)

        risk = (
            self.weights["density"] * density_score
            + self.weights["congestion"] * congestion_score
            + self.weights["motion_anomaly"] * motion_anomaly_score
            + self.weights["speed_variance"] * normalized_speed
        )

        return round(min(100.0, max(0.0, risk)), 2)

    def _normalize_speed_variance(self, speed_variance: float, max_expected: float = 50.0) -> float:
        """
        Normalize raw speed variance to 0-100 scale.
        """
        if speed_variance <= 0:
            return 0.0
        normalized = (speed_variance / max_expected) * 100
        return min(100.0, normalized)

    def classify_risk(self, risk_percentage: float) -> str:
        """
        Classify the risk percentage into a level.
        """
        for level, (low, high) in self.RISK_LEVELS.items():
            if low <= risk_percentage < high:
                return level
        return "critical"

    def get_risk_label(self, risk_level: str) -> str:
        """Get the human-readable label for a risk level."""
        return self.RISK_LEVEL_LABELS.get(risk_level, "Unknown")

    def compute_confidence(
        self,
        density_score: float,
        congestion_score: float,
        motion_anomaly_score: float,
        speed_variance: float,
        frame_count: int = 1,
    ) -> float:
        """
        Compute prediction confidence based on:
        1. Input data quality (are scores in expected ranges?)
        2. Consistency between inputs (do they agree?)
        3. Number of frames analyzed (more = higher confidence)

        Returns:
            Confidence percentage (0-100)
        """
        scores = [density_score, congestion_score, motion_anomaly_score]

        # Factor 1: Data validity (are all inputs reasonable?)
        validity = sum(1 for s in scores if 0 <= s <= 100) / len(scores)

        # Factor 2: Consistency - lower std dev = higher agreement between signals
        std_dev = float(np.std(scores)) if len(scores) > 0 else 50
        consistency = max(0, 100 - std_dev)

        # Factor 3: Frame count confidence (more frames = more reliable)
        frame_confidence = min(100, frame_count * 5)  # Maxes out at 20 frames

        # Weighted combination
        confidence = (0.3 * validity * 100) + (0.4 * consistency) + (0.3 * frame_confidence)

        return round(min(100.0, max(0.0, confidence)), 2)

    def predict(
        self,
        density_data: Dict[str, Any],
        motion_data: Dict[str, Any],
        frame_count: int = 1,
    ) -> Dict[str, Any]:
        """
        Full risk prediction from density and motion analysis outputs.

        Args:
            density_data: Output from DensityAnalyzer.analyze()
            motion_data: Output from MotionAnalyzer.analyze()
            frame_count: Number of frames analyzed (for confidence)

        Returns:
            Dictionary with risk_percentage, risk_level, confidence, component scores
        """
        # Extract scores
        density_score = density_data.get("overall_density", 0.0)
        congestion_score = density_data.get("congestion_score", 0.0)
        motion_anomaly_score = motion_data.get("primary_anomaly_score", 0.0)
        speed_variance = motion_data.get("speed", {}).get("speed_variance", 0.0)

        # Compute risk
        risk_percentage = self.compute_risk(
            density_score, congestion_score, motion_anomaly_score, speed_variance
        )

        # Classify risk level
        risk_level = self.classify_risk(risk_percentage)

        # Compute confidence
        confidence = self.compute_confidence(
            density_score, congestion_score, motion_anomaly_score,
            speed_variance, frame_count
        )

        return {
            "risk_percentage": risk_percentage,
            "risk_level": risk_level,
            "risk_label": self.get_risk_label(risk_level),
            "confidence": confidence,
            "components": {
                "density_score": round(density_score, 2),
                "congestion_score": round(congestion_score, 2),
                "motion_anomaly_score": round(motion_anomaly_score, 2),
                "speed_variance": round(speed_variance, 2),
                "speed_variance_normalized": round(
                    self._normalize_speed_variance(speed_variance), 2
                ),
            },
            "weights": self.weights,
        }

    def should_alert(self, risk_level: str) -> bool:
        """Check if the risk level warrants an alert."""
        return risk_level in ("warning", "critical")

    def get_alert_priority(self, risk_level: str) -> str:
        """Map risk level to alert priority."""
        mapping = {
            "safe": "info",
            "watch": "info",
            "warning": "warning",
            "critical": "critical",
        }
        return mapping.get(risk_level, "info")
