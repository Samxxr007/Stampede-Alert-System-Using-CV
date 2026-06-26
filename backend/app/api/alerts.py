"""
Alert API routes.
Handles alert creation, listing, acknowledging, and resolution.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.security import get_current_user_payload, require_role
from app.models.models import Alert, AlertStatus, AlertPriority
from app.schemas.schemas import (
    AlertCreate,
    AlertResponse,
    AlertListResponse,
    AlertResolveRequest,
)

router = APIRouter(prefix="/alert", tags=["Alerts"])


@router.post("/create", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Create a manual alert."""
    alert = Alert(
        camera_id=alert_data.camera_id,
        type=alert_data.type,
        priority=alert_data.priority,
        title=alert_data.title,
        message=alert_data.message,
        status=AlertStatus.ACTIVE,
    )

    db.add(alert)
    await db.flush()
    await db.refresh(alert)

    return AlertResponse.model_validate(alert)


@router.get("/list", response_model=AlertListResponse)
async def list_alerts(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    camera_id: Optional[int] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """List alerts with filtering and pagination."""
    query = select(Alert).order_by(Alert.created_at.desc())

    if status_filter:
        query = query.where(Alert.status == AlertStatus(status_filter))
    if priority_filter:
        query = query.where(Alert.priority == AlertPriority(priority_filter))
    if camera_id:
        query = query.where(Alert.camera_id == camera_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    alerts = result.scalars().all()

    # Get counts
    active_count = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == AlertStatus.ACTIVE)
    )
    warning_count = await db.execute(
        select(func.count(Alert.id)).where(
            and_(Alert.status == AlertStatus.ACTIVE, Alert.priority == AlertPriority.WARNING)
        )
    )
    critical_count = await db.execute(
        select(func.count(Alert.id)).where(
            and_(Alert.status == AlertStatus.ACTIVE, Alert.priority == AlertPriority.CRITICAL)
        )
    )

    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
        active_count=active_count.scalar() or 0,
        warning_count=warning_count.scalar() or 0,
        critical_count=critical_count.scalar() or 0,
    )


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge an active alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert.status != AlertStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Alert is not in active state")

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: int,
    resolve_data: AlertResolveRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Resolve an alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = payload.get("user_id")

    if resolve_data.resolution_note:
        alert.message = f"{alert.message or ''}\n\nResolution: {resolve_data.resolution_note}"

    await db.flush()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
