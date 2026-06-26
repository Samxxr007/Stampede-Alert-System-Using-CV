"""
Analytics & Dashboard API routes.
Provides density trends, motion data, risk history, and dashboard summary.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import (
    Camera, CameraStatus, DensityData, MotionData, RiskScore,
    Alert, AlertStatus, AlertPriority, RiskLevel,
)
from app.schemas.schemas import (
    DensityDataResponse, DensityTrendResponse,
    MotionDataResponse, MotionTrendResponse,
    RiskScoreResponse, RiskTrendResponse,
    DashboardSummary,
)

router = APIRouter(tags=["Analytics"])


# ── Density Analytics ────────────────────────────────────────────

@router.get("/analytics/density", response_model=DensityTrendResponse)
async def get_density_analytics(
    camera_id: Optional[int] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get density data with time range filtering."""
    query = select(DensityData).order_by(desc(DensityData.timestamp))

    if camera_id:
        query = query.where(DensityData.camera_id == camera_id)
    if from_time:
        query = query.where(DensityData.timestamp >= from_time)
    if to_time:
        query = query.where(DensityData.timestamp <= to_time)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    data = result.scalars().all()

    densities = [d.overall_density for d in data]
    avg_density = float(sum(densities) / len(densities)) if densities else 0.0
    max_density = float(max(densities)) if densities else 0.0

    return DensityTrendResponse(
        data=[DensityDataResponse.model_validate(d) for d in data],
        avg_density=round(avg_density, 2),
        max_density=round(max_density, 2),
        total_records=len(data),
    )


# ── Motion Analytics ─────────────────────────────────────────────

@router.get("/analytics/motion", response_model=MotionTrendResponse)
async def get_motion_analytics(
    camera_id: Optional[int] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get motion data with time range filtering."""
    query = select(MotionData).order_by(desc(MotionData.timestamp))

    if camera_id:
        query = query.where(MotionData.camera_id == camera_id)
    if from_time:
        query = query.where(MotionData.timestamp >= from_time)
    if to_time:
        query = query.where(MotionData.timestamp <= to_time)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    data = result.scalars().all()

    speeds = [d.avg_speed for d in data]
    avg_speed = float(sum(speeds) / len(speeds)) if speeds else 0.0
    max_speed = float(max(speeds)) if speeds else 0.0
    anomaly_count = sum(1 for d in data if d.anomaly_type and d.anomaly_type.value != "none")

    return MotionTrendResponse(
        data=[MotionDataResponse.model_validate(d) for d in data],
        avg_speed=round(avg_speed, 2),
        max_speed=round(max_speed, 2),
        anomaly_count=anomaly_count,
        total_records=len(data),
    )


# ── Risk Analytics ───────────────────────────────────────────────

@router.get("/analytics/risk", response_model=RiskTrendResponse)
async def get_risk_analytics(
    camera_id: Optional[int] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get risk score data with time range filtering."""
    query = select(RiskScore).order_by(desc(RiskScore.timestamp))

    if camera_id:
        query = query.where(RiskScore.camera_id == camera_id)
    if from_time:
        query = query.where(RiskScore.timestamp >= from_time)
    if to_time:
        query = query.where(RiskScore.timestamp <= to_time)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    data = result.scalars().all()

    risks = [d.risk_percentage for d in data]
    current_risk = risks[0] if risks else 0.0
    avg_risk = float(sum(risks) / len(risks)) if risks else 0.0
    max_risk = float(max(risks)) if risks else 0.0

    return RiskTrendResponse(
        data=[RiskScoreResponse.model_validate(d) for d in data],
        current_risk=round(current_risk, 2),
        avg_risk=round(avg_risk, 2),
        max_risk=round(max_risk, 2),
        total_records=len(data),
    )


# ── Dashboard Summary ────────────────────────────────────────────

@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated dashboard overview."""
    # Camera counts
    total_cameras = await db.execute(select(func.count(Camera.id)))
    active_cameras = await db.execute(
        select(func.count(Camera.id)).where(Camera.status == CameraStatus.ACTIVE)
    )

    # Alert counts
    active_alerts = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == AlertStatus.ACTIVE)
    )
    warning_alerts = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.status == AlertStatus.ACTIVE,
            Alert.priority == AlertPriority.WARNING,
        )
    )
    critical_alerts = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.status == AlertStatus.ACTIVE,
            Alert.priority == AlertPriority.CRITICAL,
        )
    )

    # Latest risk score (across all cameras)
    latest_risk = await db.execute(
        select(RiskScore).order_by(desc(RiskScore.timestamp)).limit(1)
    )
    latest_risk_data = latest_risk.scalar_one_or_none()

    current_risk_level = "safe"
    current_risk_pct = 0.0
    if latest_risk_data:
        current_risk_level = latest_risk_data.risk_level.value
        current_risk_pct = latest_risk_data.risk_percentage

    # Latest density (for crowd count)
    latest_density = await db.execute(
        select(DensityData).order_by(desc(DensityData.timestamp)).limit(1)
    )
    density_data = latest_density.scalar_one_or_none()
    crowd_count = density_data.crowd_count_estimate if density_data else 0
    avg_density = density_data.overall_density if density_data else 0.0

    # Latest motion speed
    latest_motion = await db.execute(
        select(MotionData).order_by(desc(MotionData.timestamp)).limit(1)
    )
    motion_data = latest_motion.scalar_one_or_none()
    avg_speed = motion_data.avg_speed if motion_data else 0.0

    # Per-camera quick stats
    cameras_result = await db.execute(select(Camera).order_by(Camera.id))
    cameras = cameras_result.scalars().all()
    camera_stats = []
    for cam in cameras:
        # Get latest risk for this camera
        cam_risk = await db.execute(
            select(RiskScore)
            .where(RiskScore.camera_id == cam.id)
            .order_by(desc(RiskScore.timestamp))
            .limit(1)
        )
        cam_risk_data = cam_risk.scalar_one_or_none()

        camera_stats.append({
            "id": cam.id,
            "name": cam.name,
            "location": cam.location,
            "status": cam.status.value,
            "risk_level": cam_risk_data.risk_level.value if cam_risk_data else "safe",
            "risk_percentage": cam_risk_data.risk_percentage if cam_risk_data else 0.0,
        })

    return DashboardSummary(
        active_cameras=active_cameras.scalar() or 0,
        total_cameras=total_cameras.scalar() or 0,
        current_crowd_count=crowd_count,
        current_risk_level=current_risk_level,
        current_risk_percentage=current_risk_pct,
        active_alerts=active_alerts.scalar() or 0,
        warning_alerts=warning_alerts.scalar() or 0,
        critical_alerts=critical_alerts.scalar() or 0,
        avg_density=round(avg_density, 2),
        avg_motion_speed=round(avg_speed, 2),
        cameras=camera_stats,
    )
