"""
Unit tests for the Risk Prediction Engine (Module 5).
"""

import pytest
from app.ai.risk import RiskPredictor


@pytest.fixture
def predictor():
    return RiskPredictor()


class TestRiskPredictor:
    def test_compute_risk_all_zero(self, predictor):
        risk = predictor.compute_risk(0, 0, 0, 0)
        assert risk == 0.0

    def test_compute_risk_all_max(self, predictor):
        risk = predictor.compute_risk(100, 100, 100, 50)
        assert risk <= 100.0
        assert risk >= 80.0  # Should be high with all max inputs

    def test_compute_risk_formula(self, predictor):
        """Verify the exact formula: 0.35*D + 0.25*C + 0.25*M + 0.15*S_norm"""
        risk = predictor.compute_risk(50, 50, 50, 25)
        # Speed normalized: 25/50*100 = 50
        expected = 0.35 * 50 + 0.25 * 50 + 0.25 * 50 + 0.15 * 50
        assert abs(risk - expected) < 0.1

    def test_classify_risk_safe(self, predictor):
        assert predictor.classify_risk(0) == "safe"
        assert predictor.classify_risk(10) == "safe"
        assert predictor.classify_risk(24.9) == "safe"

    def test_classify_risk_watch(self, predictor):
        assert predictor.classify_risk(25) == "watch"
        assert predictor.classify_risk(35) == "watch"
        assert predictor.classify_risk(49.9) == "watch"

    def test_classify_risk_warning(self, predictor):
        assert predictor.classify_risk(50) == "warning"
        assert predictor.classify_risk(60) == "warning"
        assert predictor.classify_risk(74.9) == "warning"

    def test_classify_risk_critical(self, predictor):
        assert predictor.classify_risk(75) == "critical"
        assert predictor.classify_risk(90) == "critical"
        assert predictor.classify_risk(100) == "critical"

    def test_compute_confidence_high(self, predictor):
        # Consistent inputs with many frames -> high confidence
        conf = predictor.compute_confidence(50, 50, 50, 25, frame_count=30)
        assert conf > 60

    def test_compute_confidence_low(self, predictor):
        # Inconsistent inputs with few frames -> lower confidence
        conf = predictor.compute_confidence(10, 90, 50, 5, frame_count=1)
        assert conf < 70

    def test_predict_full(self, predictor):
        density_data = {
            "overall_density": 65.0,
            "congestion_score": 55.0,
        }
        motion_data = {
            "primary_anomaly_score": 30.0,
            "speed": {"speed_variance": 10.0},
        }
        result = predictor.predict(density_data, motion_data, frame_count=15)

        assert "risk_percentage" in result
        assert "risk_level" in result
        assert "confidence" in result
        assert "components" in result
        assert 0 <= result["risk_percentage"] <= 100
        assert result["risk_level"] in ("safe", "watch", "warning", "critical")

    def test_should_alert(self, predictor):
        assert not predictor.should_alert("safe")
        assert not predictor.should_alert("watch")
        assert predictor.should_alert("warning")
        assert predictor.should_alert("critical")

    def test_get_alert_priority(self, predictor):
        assert predictor.get_alert_priority("safe") == "info"
        assert predictor.get_alert_priority("warning") == "warning"
        assert predictor.get_alert_priority("critical") == "critical"

    def test_custom_weights(self):
        custom = RiskPredictor(weights={
            "density": 0.5,
            "congestion": 0.2,
            "motion_anomaly": 0.2,
            "speed_variance": 0.1,
        })
        risk = custom.compute_risk(100, 0, 0, 0)
        assert risk > 40  # Density weighted heavily
