"""
SQLAlchemy ORM models for all database tables.
"""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ── Enums ────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"


class CameraStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class DensityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskLevel(str, enum.Enum):
    SAFE = "safe"           # Level 1: 0-25
    WATCH = "watch"         # Level 2: 25-50
    WARNING = "warning"     # Level 3: 50-75
    CRITICAL = "critical"   # Level 4: 75-100


class AlertType(str, enum.Enum):
    DASHBOARD = "dashboard"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    PUSH = "push"


class AlertPriority(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AnomalyType(str, enum.Enum):
    NONE = "none"
    OPPOSING_MOVEMENT = "opposing_movement"
    SUDDEN_RUNNING = "sudden_running"
    CROWD_DISPERSION = "crowd_dispersion"
    CROWD_CONVERGENCE = "crowd_convergence"
    CHAOTIC_MOVEMENT = "chaotic_movement"


# ── Helper ───────────────────────────────────────────────────────

def utcnow():
    return datetime.now(timezone.utc)


# ── Models ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    cameras = relationship("Camera", back_populates="created_by_user")
    resolved_alerts = relationship("Alert", back_populates="resolved_by_user")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    stream_url = Column(String(500), nullable=False)
    status = Column(Enum(CameraStatus), default=CameraStatus.INACTIVE)
    zone_config = Column(JSON, default=lambda: {"rows": 4, "cols": 4})
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    created_by_user = relationship("User", back_populates="cameras")
    frames = relationship("Frame", back_populates="camera", cascade="all, delete-orphan")
    density_data = relationship("DensityData", back_populates="camera", cascade="all, delete-orphan")
    motion_data = relationship("MotionData", back_populates="camera", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="camera", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Camera(id={self.id}, name='{self.name}', status='{self.status}')>"


class Frame(Base):
    __tablename__ = "frames"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    raw_path = Column(String(500), nullable=True)
    enhanced_path = Column(String(500), nullable=True)
    segmentation_path = Column(String(500), nullable=True)
    heatmap_path = Column(String(500), nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)

    # Relationships
    camera = relationship("Camera", back_populates="frames")
    density_data = relationship("DensityData", back_populates="frame", cascade="all, delete-orphan")
    motion_data = relationship("MotionData", back_populates="frame", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_frames_camera_timestamp", "camera_id", "timestamp"),
    )


class DensityData(Base):
    __tablename__ = "density_data"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    frame_id = Column(Integer, ForeignKey("frames.id", ondelete="CASCADE"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    zone_scores = Column(JSON, default=dict)  # {"zone_0_0": 45.2, "zone_0_1": 12.8, ...}
    overall_density = Column(Float, default=0.0)
    level = Column(Enum(DensityLevel), default=DensityLevel.LOW)
    crowd_count_estimate = Column(Integer, default=0)
    occupied_area_pct = Column(Float, default=0.0)
    heatmap_path = Column(String(500), nullable=True)
    hotspots = Column(JSON, default=list)  # [{"zone": "zone_2_3", "score": 89.5}, ...]

    # Relationships
    camera = relationship("Camera", back_populates="density_data")
    frame = relationship("Frame", back_populates="density_data")

    __table_args__ = (
        Index("ix_density_camera_timestamp", "camera_id", "timestamp"),
    )


class MotionData(Base):
    __tablename__ = "motion_data"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    frame_id = Column(Integer, ForeignKey("frames.id", ondelete="CASCADE"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    flow_vectors = Column(JSON, default=dict)  # Summarized zone-level vectors
    avg_speed = Column(Float, default=0.0)
    avg_direction = Column(Float, default=0.0)  # degrees
    max_speed = Column(Float, default=0.0)
    speed_variance = Column(Float, default=0.0)
    anomaly_type = Column(Enum(AnomalyType), default=AnomalyType.NONE)
    anomaly_score = Column(Float, default=0.0)
    flow_consistency = Column(Float, default=0.0)  # 0-100, how uniform is the flow

    # Relationships
    camera = relationship("Camera", back_populates="motion_data")
    frame = relationship("Frame", back_populates="motion_data")

    __table_args__ = (
        Index("ix_motion_camera_timestamp", "camera_id", "timestamp"),
    )


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    density_score = Column(Float, default=0.0)
    congestion_score = Column(Float, default=0.0)
    motion_anomaly_score = Column(Float, default=0.0)
    speed_variance = Column(Float, default=0.0)
    risk_percentage = Column(Float, default=0.0)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.SAFE)
    confidence = Column(Float, default=0.0)

    # Relationships
    camera = relationship("Camera", back_populates="risk_scores")
    alerts = relationship("Alert", back_populates="risk_score")

    __table_args__ = (
        Index("ix_risk_camera_timestamp", "camera_id", "timestamp"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id"), nullable=True)
    type = Column(Enum(AlertType), default=AlertType.DASHBOARD)
    priority = Column(Enum(AlertPriority), default=AlertPriority.INFO)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, index=True)
    evidence_path = Column(String(500), nullable=True)  # Snapshot of the triggering frame
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    camera = relationship("Camera", back_populates="alerts")
    risk_score = relationship("RiskScore", back_populates="alerts")
    resolved_by_user = relationship("User", back_populates="resolved_alerts")

    __table_args__ = (
        Index("ix_alerts_camera_status", "camera_id", "status"),
        Index("ix_alerts_priority_status", "priority", "status"),
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=True)
    report_type = Column(String(50), nullable=False)  # "hourly", "daily", "incident"
    title = Column(String(200), nullable=False)
    time_range_start = Column(DateTime(timezone=True), nullable=False)
    time_range_end = Column(DateTime(timezone=True), nullable=False)
    data = Column(JSON, default=dict)
    generated_at = Column(DateTime(timezone=True), default=utcnow)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
