"""
Pydantic schemas for request/response validation across all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────

class UserRoleEnum(str, Enum):
    admin = "admin"
    operator = "operator"


class CameraStatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"
    error = "error"


class DensityLevelEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RiskLevelEnum(str, Enum):
    safe = "safe"
    watch = "watch"
    warning = "warning"
    critical = "critical"


class AlertTypeEnum(str, Enum):
    dashboard = "dashboard"
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"
    push = "push"


class AlertPriorityEnum(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertStatusEnum(str, Enum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"


class AnomalyTypeEnum(str, Enum):
    none = "none"
    opposing_movement = "opposing_movement"
    sudden_running = "sudden_running"
    crowd_dispersion = "crowd_dispersion"
    crowd_convergence = "crowd_convergence"
    chaotic_movement = "chaotic_movement"


# ── Auth Schemas ─────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.operator


# ── User Schemas ─────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


# ── Camera Schemas ───────────────────────────────────────────────

class CameraCreate(BaseModel):
    name: str = Field(..., max_length=100)
    location: Optional[str] = None
    description: Optional[str] = None
    stream_url: str
    zone_config: Optional[Dict[str, int]] = {"rows": 4, "cols": 4}
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    stream_url: Optional[str] = None
    status: Optional[CameraStatusEnum] = None
    zone_config: Optional[Dict[str, int]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CameraResponse(BaseModel):
    id: int
    name: str
    location: Optional[str]
    description: Optional[str]
    stream_url: str
    status: CameraStatusEnum
    zone_config: Dict[str, Any]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class CameraListResponse(BaseModel):
    cameras: List[CameraResponse]
    total: int


# ── Density Schemas ──────────────────────────────────────────────

class DensityDataResponse(BaseModel):
    id: int
    camera_id: int
    timestamp: datetime
    zone_scores: Dict[str, float]
    overall_density: float
    level: DensityLevelEnum
    crowd_count_estimate: int
    occupied_area_pct: float
    hotspots: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class DensityTrendResponse(BaseModel):
    data: List[DensityDataResponse]
    avg_density: float
    max_density: float
    total_records: int


# ── Motion Schemas ───────────────────────────────────────────────

class MotionDataResponse(BaseModel):
    id: int
    camera_id: int
    timestamp: datetime
    avg_speed: float
    avg_direction: float
    max_speed: float
    speed_variance: float
    anomaly_type: AnomalyTypeEnum
    anomaly_score: float
    flow_consistency: float

    class Config:
        from_attributes = True


class MotionTrendResponse(BaseModel):
    data: List[MotionDataResponse]
    avg_speed: float
    max_speed: float
    anomaly_count: int
    total_records: int


# ── Risk Schemas ─────────────────────────────────────────────────

class RiskScoreResponse(BaseModel):
    id: int
    camera_id: int
    timestamp: datetime
    density_score: float
    congestion_score: float
    motion_anomaly_score: float
    speed_variance: float
    risk_percentage: float
    risk_level: RiskLevelEnum
    confidence: float

    class Config:
        from_attributes = True


class RiskTrendResponse(BaseModel):
    data: List[RiskScoreResponse]
    current_risk: float
    avg_risk: float
    max_risk: float
    total_records: int


# ── Alert Schemas ────────────────────────────────────────────────

class AlertCreate(BaseModel):
    camera_id: int
    type: AlertTypeEnum = AlertTypeEnum.dashboard
    priority: AlertPriorityEnum = AlertPriorityEnum.info
    title: str
    message: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    camera_id: int
    risk_score_id: Optional[int]
    type: AlertTypeEnum
    priority: AlertPriorityEnum
    title: str
    message: Optional[str]
    status: AlertStatusEnum
    evidence_path: Optional[str]
    created_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    active_count: int
    warning_count: int
    critical_count: int


class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


# ── Dashboard Schemas ────────────────────────────────────────────

class DashboardSummary(BaseModel):
    active_cameras: int
    total_cameras: int
    current_crowd_count: int
    current_risk_level: RiskLevelEnum
    current_risk_percentage: float
    active_alerts: int
    warning_alerts: int
    critical_alerts: int
    avg_density: float
    avg_motion_speed: float
    cameras: List[Dict[str, Any]]  # Per-camera quick stats


# ── WebSocket Schemas ────────────────────────────────────────────

class WSFrameData(BaseModel):
    camera_id: int
    timestamp: str
    density: DensityDataResponse
    motion: MotionDataResponse
    risk: RiskScoreResponse


class WSAlertData(BaseModel):
    alert: AlertResponse
    camera_name: str


# ── Analytics Query ──────────────────────────────────────────────

class AnalyticsQuery(BaseModel):
    camera_id: Optional[int] = None
    from_time: Optional[datetime] = None
    to_time: Optional[datetime] = None
    limit: int = Field(default=100, le=1000)
    offset: int = 0


# Forward reference resolution
TokenResponse.model_rebuild()
