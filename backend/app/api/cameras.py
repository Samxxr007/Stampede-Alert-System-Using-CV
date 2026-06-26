"""
Camera API routes.
Handles camera CRUD operations and zone configuration.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_payload, require_role
from app.models.models import Camera, CameraStatus
from app.schemas.schemas import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    CameraListResponse,
)

router = APIRouter(prefix="/camera", tags=["Cameras"])


@router.post("/add", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def add_camera(
    camera_data: CameraCreate,
    payload: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Add a new camera (admin only)."""
    camera = Camera(
        name=camera_data.name,
        location=camera_data.location,
        description=camera_data.description,
        stream_url=camera_data.stream_url,
        zone_config=camera_data.zone_config or {"rows": 4, "cols": 4},
        latitude=camera_data.latitude,
        longitude=camera_data.longitude,
        status=CameraStatus.INACTIVE,
        created_by=payload.get("user_id"),
    )

    db.add(camera)
    await db.flush()
    await db.refresh(camera)

    return CameraResponse.model_validate(camera)


@router.get("/list", response_model=CameraListResponse)
async def list_cameras(
    status_filter: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """List all cameras with optional status filter."""
    query = select(Camera).order_by(Camera.created_at.desc())

    if status_filter:
        query = query.where(Camera.status == CameraStatus(status_filter))

    result = await db.execute(query)
    cameras = result.scalars().all()

    return CameraListResponse(
        cameras=[CameraResponse.model_validate(c) for c in cameras],
        total=len(cameras),
    )


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get camera details by ID."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return CameraResponse.model_validate(camera)


@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: int,
    camera_data: CameraUpdate,
    payload: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update camera details (admin only)."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = camera_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)

    await db.flush()
    await db.refresh(camera)
    return CameraResponse.model_validate(camera)


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: int,
    payload: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a camera (admin only)."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    await db.delete(camera)


@router.put("/{camera_id}/zones", response_model=CameraResponse)
async def update_zones(
    camera_id: int,
    zone_config: dict,
    payload: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update zone grid configuration for a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera.zone_config = zone_config
    await db.flush()
    await db.refresh(camera)
    return CameraResponse.model_validate(camera)
