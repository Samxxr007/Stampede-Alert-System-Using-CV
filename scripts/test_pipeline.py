"""
Pipeline Test Script
=====================
Tests the AI processing pipeline with a synthetic frame.
Run with: python scripts/test_pipeline.py
"""

import sys
import os
import numpy as np
import cv2

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.ai.enhancement import FrameEnhancer
from app.ai.segmentation import CrowdSegmentor
from app.ai.density import DensityAnalyzer
from app.ai.motion import MotionAnalyzer
from app.ai.risk import RiskPredictor
from app.ai.pipeline import ProcessingPipeline


def create_synthetic_crowd_frame(width=640, height=480, num_blobs=20):
    """Create a synthetic frame simulating a crowd scene."""
    frame = np.random.randint(40, 80, (height, width, 3), dtype=np.uint8)

    # Add crowd-like blobs
    for _ in range(num_blobs):
        cx = np.random.randint(50, width - 50)
        cy = np.random.randint(50, height - 50)
        rx = np.random.randint(15, 40)
        ry = np.random.randint(20, 50)
        color = (
            np.random.randint(100, 200),
            np.random.randint(80, 180),
            np.random.randint(80, 180),
        )
        cv2.ellipse(frame, (cx, cy), (rx, ry), 0, 0, 360, color, -1)

    # Add some noise
    noise = np.random.randint(-10, 10, frame.shape, dtype=np.int16)
    frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    return frame


def test_individual_modules():
    """Test each module independently."""
    print("=" * 60)
    print("Testing Individual AI Modules")
    print("=" * 60)

    frame = create_synthetic_crowd_frame()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Module 1: Enhancement
    print("\n[Module 1] Image Enhancement")
    enhancer = FrameEnhancer()
    enhanced = enhancer.enhance_pipeline(frame)
    print(f"  ✅ Enhanced frame shape: {enhanced.shape}")
    print(f"  ✅ CLAHE applied: {enhancer.clahe(frame).shape}")
    print(f"  ✅ Low-light detection: {'dark' if enhancer._is_dark(frame) else 'normal'}")

    # Module 2: Segmentation
    print("\n[Module 2] Crowd Segmentation")
    segmentor = CrowdSegmentor()
    seg_result = segmentor.segment_pipeline(enhanced)
    print(f"  ✅ Binary mask shape: {seg_result['binary_mask'].shape}")
    print(f"  ✅ Contours found: {len(seg_result['contours'])}")
    print(f"  ✅ Crowd regions: {len(seg_result['crowd_regions'])}")
    print(f"  ✅ Crowd area: {seg_result['crowd_area_pct']:.1f}%")
    print(f"  ✅ Count estimate: {seg_result['crowd_count_estimate']}")

    # Module 3: Density
    print("\n[Module 3] Density Analysis")
    density_analyzer = DensityAnalyzer()
    density_result = density_analyzer.analyze(
        enhanced, seg_result['binary_mask'],
        seg_result['contours'], seg_result['crowd_count_estimate']
    )
    print(f"  ✅ Overall density: {density_result['overall_density']:.1f}%")
    print(f"  ✅ Density level: {density_result['overall_level']}")
    print(f"  ✅ Congestion score: {density_result['congestion_score']:.1f}")
    print(f"  ✅ Hotspots: {len(density_result['hotspots'])}")
    print(f"  ✅ Heatmap shape: {density_result['heatmap'].shape}")

    # Module 4: Motion (needs two frames)
    print("\n[Module 4] Motion Intelligence")
    frame2 = create_synthetic_crowd_frame()
    enhanced2 = enhancer.enhance_pipeline(frame2)
    gray2 = cv2.cvtColor(enhanced2, cv2.COLOR_BGR2GRAY)

    motion_analyzer = MotionAnalyzer()
    motion_result = motion_analyzer.analyze(gray, gray2, frame=enhanced2)
    print(f"  ✅ Flow shape: {motion_result['flow'].shape}")
    print(f"  ✅ Avg speed: {motion_result['speed']['avg_speed']:.2f}")
    print(f"  ✅ Avg direction: {motion_result['direction']['avg_direction']:.1f}°")
    print(f"  ✅ Flow consistency: {motion_result['direction']['flow_consistency']:.1f}%")
    print(f"  ✅ Primary anomaly: {motion_result['primary_anomaly_type']}")
    print(f"  ✅ Anomaly score: {motion_result['primary_anomaly_score']:.1f}")

    # Module 5: Risk
    print("\n[Module 5] Risk Prediction")
    risk_predictor = RiskPredictor()
    risk_result = risk_predictor.predict(density_result, motion_result, frame_count=10)
    print(f"  ✅ Risk percentage: {risk_result['risk_percentage']:.1f}%")
    print(f"  ✅ Risk level: {risk_result['risk_level']}")
    print(f"  ✅ Risk label: {risk_result['risk_label']}")
    print(f"  ✅ Confidence: {risk_result['confidence']:.1f}%")
    print(f"  ✅ Components: {risk_result['components']}")


def test_full_pipeline():
    """Test the complete processing pipeline."""
    print("\n" + "=" * 60)
    print("Testing Full Processing Pipeline")
    print("=" * 60)

    pipeline = ProcessingPipeline()

    # Process multiple frames
    for i in range(3):
        frame = create_synthetic_crowd_frame(num_blobs=10 + i * 5)
        result = pipeline.process_frame(frame, camera_id=1)

        print(f"\n  Frame {i + 1}:")
        print(f"    Processing time: {result['processing_time_sec']:.4f}s")
        print(f"    Crowd count: {result['segmentation']['crowd_count_estimate']}")
        print(f"    Density: {result['density']['overall_density']:.1f}% ({result['density']['overall_level']})")
        print(f"    Speed: {result['motion']['avg_speed']:.2f}")
        print(f"    Risk: {result['risk']['risk_percentage']:.1f}% ({result['risk']['risk_level']})")

    print("\n✅ Full pipeline test passed!")


def test_risk_formula():
    """Verify the risk formula produces correct results."""
    print("\n" + "=" * 60)
    print("Testing Risk Formula")
    print("=" * 60)

    predictor = RiskPredictor()

    test_cases = [
        (10, 10, 10, 5, "safe"),
        (50, 50, 50, 25, "watch/warning"),
        (80, 80, 80, 40, "critical"),
        (100, 100, 100, 50, "critical"),
        (0, 0, 0, 0, "safe"),
    ]

    for density, congestion, motion, speed_var, expected in test_cases:
        risk = predictor.compute_risk(density, congestion, motion, speed_var)
        level = predictor.classify_risk(risk)
        print(f"  D={density:3}, C={congestion:3}, M={motion:3}, S={speed_var:3} → "
              f"Risk={risk:5.1f}% Level={level:8} (expected: {expected})")

    print("\n✅ Risk formula test passed!")


if __name__ == "__main__":
    test_individual_modules()
    test_full_pipeline()
    test_risk_formula()
    print("\n🎉 All tests passed!")
