"""
Database Seeding Script
========================
Populates the database with demo users, cameras, and sample data.
Run with: python scripts/seed_db.py
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.models import (
    User, UserRole, Camera, CameraStatus,
    DensityData, DensityLevel, MotionData, AnomalyType,
    RiskScore, RiskLevel, Alert, AlertType, AlertPriority, AlertStatus,
)


async def seed():
    print("🌱 Seeding database...")

    await init_db()

    async with AsyncSessionLocal() as session:
        # ── Users ────────────────────────────────────────────
        admin = User(
            username="admin",
            email="admin@crowdrisk.ai",
            hashed_password=hash_password("admin123"),
            full_name="System Admin",
            role=UserRole.ADMIN,
        )
        operator = User(
            username="operator",
            email="operator@crowdrisk.ai",
            hashed_password=hash_password("operator123"),
            full_name="Security Operator",
            role=UserRole.OPERATOR,
        )
        session.add_all([admin, operator])
        await session.flush()
        print("  ✅ Users created (admin/admin123, operator/operator123)")

        # ── Cameras ──────────────────────────────────────────
        cameras_data = [
            ("Main Entry Gate", "North Entrance", "rtsp://192.168.1.10/stream"),
            ("Platform 1", "West Wing", "rtsp://192.168.1.11/stream"),
            ("Food Court", "Central Area", "/videos/food_court.mp4"),
            ("Exit Zone B", "South Exit", "rtsp://192.168.1.13/stream"),
            ("VIP Lounge", "East Wing", "rtsp://192.168.1.15/stream"),
            ("Parking Area", "Basement", "rtsp://192.168.1.14/stream"),
        ]

        cameras = []
        for name, loc, url in cameras_data:
            cam = Camera(
                name=name,
                location=loc,
                stream_url=url,
                status=CameraStatus.ACTIVE if "parking" not in name.lower() else CameraStatus.INACTIVE,
                zone_config={"rows": 4, "cols": 4},
                created_by=admin.id,
            )
            session.add(cam)
            cameras.append(cam)

        await session.flush()
        print(f"  ✅ {len(cameras)} cameras created")

        # ── Sample Analytics Data (24 hours) ─────────────────
        now = datetime.now(timezone.utc)
        density_levels = list(DensityLevel)
        risk_levels = list(RiskLevel)
        anomaly_types = list(AnomalyType)

        records = 0
        for cam in cameras[:4]:  # Only active cameras
            for hour in range(24):
                ts = now - timedelta(hours=24 - hour)

                # Density
                density_val = random.uniform(10, 90)
                level = (
                    DensityLevel.LOW if density_val < 25 else
                    DensityLevel.MEDIUM if density_val < 50 else
                    DensityLevel.HIGH if density_val < 75 else
                    DensityLevel.CRITICAL
                )
                dd = DensityData(
                    camera_id=cam.id,
                    timestamp=ts,
                    zone_scores={"zone_0_0": round(random.uniform(5, 95), 1)},
                    overall_density=round(density_val, 2),
                    level=level,
                    crowd_count_estimate=int(density_val * 10),
                    occupied_area_pct=round(density_val * 0.8, 2),
                    hotspots=[],
                )
                session.add(dd)

                # Motion
                speed = random.uniform(0.5, 8.0)
                md = MotionData(
                    camera_id=cam.id,
                    timestamp=ts,
                    avg_speed=round(speed, 2),
                    avg_direction=round(random.uniform(0, 360), 1),
                    max_speed=round(speed * 1.5, 2),
                    speed_variance=round(random.uniform(0.5, 15), 2),
                    anomaly_type=random.choice(anomaly_types),
                    anomaly_score=round(random.uniform(0, 60), 2),
                    flow_consistency=round(random.uniform(40, 95), 2),
                )
                session.add(md)

                # Risk
                risk_pct = round(0.35 * density_val + 0.25 * random.uniform(10, 70) + 0.25 * random.uniform(0, 50) + 0.15 * random.uniform(0, 30), 2)
                risk_pct = min(100, risk_pct)
                risk_lvl = (
                    RiskLevel.SAFE if risk_pct < 25 else
                    RiskLevel.WATCH if risk_pct < 50 else
                    RiskLevel.WARNING if risk_pct < 75 else
                    RiskLevel.CRITICAL
                )
                rs = RiskScore(
                    camera_id=cam.id,
                    timestamp=ts,
                    density_score=round(density_val, 2),
                    congestion_score=round(random.uniform(10, 70), 2),
                    motion_anomaly_score=round(random.uniform(0, 50), 2),
                    speed_variance=round(random.uniform(0.5, 15), 2),
                    risk_percentage=risk_pct,
                    risk_level=risk_lvl,
                    confidence=round(random.uniform(60, 95), 2),
                )
                session.add(rs)
                records += 3

        await session.flush()
        print(f"  ✅ {records} analytics records created (24h × 4 cameras)")

        # ── Sample Alerts ────────────────────────────────────
        alerts_data = [
            (cameras[1].id, AlertPriority.CRITICAL, AlertStatus.ACTIVE,
             "🔴 CRITICAL RISK — Platform 1",
             "Risk Level: CRITICAL (87.3%)\nCrowd Density: CRITICAL (92%)"),
            (cameras[3].id, AlertPriority.WARNING, AlertStatus.ACTIVE,
             "🟠 WARNING — Exit Zone B",
             "Risk Level: WARNING (62.1%)\nCrowd Density: HIGH (71%)"),
            (cameras[0].id, AlertPriority.WARNING, AlertStatus.ACKNOWLEDGED,
             "🟠 WARNING — Main Entry Gate",
             "Congestion detected at zone_1_2"),
        ]

        for cam_id, priority, status, title, msg in alerts_data:
            alert = Alert(
                camera_id=cam_id,
                type=AlertType.DASHBOARD,
                priority=priority,
                status=status,
                title=title,
                message=msg,
            )
            session.add(alert)

        await session.commit()
        print(f"  ✅ {len(alerts_data)} sample alerts created")

    print("\n🎉 Database seeded successfully!")
    print("   Login credentials:")
    print("   Admin:    admin / admin123")
    print("   Operator: operator / operator123")


if __name__ == "__main__":
    asyncio.run(seed())
