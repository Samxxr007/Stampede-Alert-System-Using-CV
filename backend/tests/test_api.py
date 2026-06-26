"""
Integration tests for the FastAPI REST endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta

from app.main import app
from app.core.database import get_db, Base
from app.models.models import User, Camera, Alert, DensityData, MotionData, RiskScore, UserRole, CameraStatus, AlertStatus, AlertPriority, RiskLevel, AnomalyType, DensityLevel
from app.core.security import hash_password

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Override the get_db dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestAPIEndpoints:
    
    @pytest.mark.anyio
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    @pytest.mark.anyio
    async def test_auth_flow(self, client):
        # 1. Register first user (automatically ADMIN)
        register_payload = {
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "secretpassword",
            "full_name": "Admin User",
            "role": "admin"
        }
        res = await client.post("/api/v1/auth/register", json=register_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["username"] == "adminuser"
        assert data["role"] == "admin"

        # 2. Register second user (defaults to OPERATOR)
        operator_payload = {
            "username": "operatoruser",
            "email": "operator@example.com",
            "password": "secretpassword2",
            "full_name": "Operator User",
            "role": "operator"
        }
        res = await client.post("/api/v1/auth/register", json=operator_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["username"] == "operatoruser"
        assert data["role"] == "operator"

        # 3. Login Admin
        login_res = await client.post(
            "/api/v1/auth/login",
            data={"username": "adminuser", "password": "secretpassword"}
        )
        assert login_res.status_code == 200
        tokens = login_res.json()
        assert "access_token" in tokens
        admin_token = tokens["access_token"]

        # 4. Get profile /me
        me_res = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "adminuser"

        # 5. List users (admin only)
        users_res = await client.get(
            "/api/v1/auth/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert users_res.status_code == 200
        assert users_res.json()["total"] == 2

    @pytest.mark.anyio
    async def test_camera_flow(self, client):
        # Setup admin auth token
        await client.post("/api/v1/auth/register", json={
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "secretpassword",
            "full_name": "Admin User",
            "role": "admin"
        })
        login_res = await client.post(
            "/api/v1/auth/login",
            data={"username": "adminuser", "password": "secretpassword"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Add Camera
        camera_data = {
            "name": "Main Entrance",
            "location": "North Lobby",
            "description": "Primary crowd monitoring camera at entrance",
            "stream_url": "rtsp://mock-stream.url/live",
            "zone_config": {"rows": 4, "cols": 4},
            "latitude": 37.7749,
            "longitude": -122.4194
        }
        res = await client.post("/api/v1/camera/add", json=camera_data, headers=headers)
        assert res.status_code == 201
        cam = res.json()
        assert cam["name"] == "Main Entrance"
        camera_id = cam["id"]

        # 2. List Cameras
        res = await client.get("/api/v1/camera/list", headers=headers)
        assert res.status_code == 200
        assert res.json()["total"] == 1

        # 3. Get Camera details
        res = await client.get(f"/api/v1/camera/{camera_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["name"] == "Main Entrance"

        # 4. Update Camera
        update_data = {
            "name": "Main Entrance - Updated",
            "status": "active"
        }
        res = await client.put(f"/api/v1/camera/{camera_id}", json=update_data, headers=headers)
        assert res.status_code == 200
        assert res.json()["name"] == "Main Entrance - Updated"
        assert res.json()["status"] == "active"

        # 5. Delete Camera
        res = await client.delete(f"/api/v1/camera/{camera_id}", headers=headers)
        assert res.status_code == 204

        # Verify deletion
        res = await client.get(f"/api/v1/camera/{camera_id}", headers=headers)
        assert res.status_code == 404

    @pytest.mark.anyio
    async def test_alert_flow(self, client):
        # Setup auth & camera
        await client.post("/api/v1/auth/register", json={
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "secretpassword",
            "full_name": "Admin User",
            "role": "admin"
        })
        login_res = await client.post(
            "/api/v1/auth/login",
            data={"username": "adminuser", "password": "secretpassword"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        cam_res = await client.post("/api/v1/camera/add", json={
            "name": "Platform 1",
            "stream_url": "rtsp://test/1",
        }, headers=headers)
        camera_id = cam_res.json()["id"]

        # 1. Create Alert
        alert_data = {
            "camera_id": camera_id,
            "type": "dashboard",
            "priority": "warning",
            "title": "Congestion Alert",
            "message": "Heavy crowd detected on Platform 1"
        }
        res = await client.post("/api/v1/alert/create", json=alert_data, headers=headers)
        assert res.status_code == 201
        alert = res.json()
        assert alert["title"] == "Congestion Alert"
        assert alert["status"] == "active"
        alert_id = alert["id"]

        # 2. List Alerts
        res = await client.get("/api/v1/alert/list", headers=headers)
        assert res.status_code == 200
        assert res.json()["total"] == 1
        assert res.json()["active_count"] == 1

        # 3. Acknowledge Alert
        res = await client.put(f"/api/v1/alert/{alert_id}/acknowledge", headers=headers)
        assert res.status_code == 200
        assert res.json()["status"] == "acknowledged"

        # 4. Resolve Alert
        res = await client.put(
            f"/api/v1/alert/{alert_id}/resolve",
            json={"resolution_note": "Crowd dispersed naturally"},
            headers=headers
        )
        assert res.status_code == 200
        assert res.json()["status"] == "resolved"
        assert "Resolution" in res.json()["message"]

    @pytest.mark.anyio
    async def test_analytics_and_dashboard(self, client):
        # Setup auth
        await client.post("/api/v1/auth/register", json={
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "secretpassword",
            "full_name": "Admin User",
            "role": "admin"
        })
        login_res = await client.post(
            "/api/v1/auth/login",
            data={"username": "adminuser", "password": "secretpassword"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Add Camera
        cam_res = await client.post("/api/v1/camera/add", json={
            "name": "South Gate",
            "stream_url": "rtsp://test/gate",
        }, headers=headers)
        camera_id = cam_res.json()["id"]

        # Directly seed mock analytical data into database
        async with TestingSessionLocal() as session:
            # Mark camera active
            result = await session.execute(select(Camera).where(Camera.id == camera_id))
            cam = result.scalar_one()
            cam.status = CameraStatus.ACTIVE

            # Density
            density = DensityData(
                camera_id=camera_id,
                overall_density=45.5,
                level=DensityLevel.MEDIUM,
                crowd_count_estimate=150,
                occupied_area_pct=25.5,
            )
            # Motion
            motion = MotionData(
                camera_id=camera_id,
                avg_speed=3.4,
                avg_direction=90.0,
                anomaly_type=AnomalyType.NONE,
                anomaly_score=15.0,
            )
            # Risk
            risk = RiskScore(
                camera_id=camera_id,
                risk_percentage=35.0,
                risk_level=RiskLevel.WATCH,
            )
            session.add_all([density, motion, risk])
            await session.commit()

        # 1. Fetch Density Analytics
        res = await client.get(f"/api/v1/analytics/density?camera_id={camera_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["avg_density"] == 45.5

        # 2. Fetch Motion Analytics
        res = await client.get(f"/api/v1/analytics/motion?camera_id={camera_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["avg_speed"] == 3.4

        # 3. Fetch Risk Analytics
        res = await client.get(f"/api/v1/analytics/risk?camera_id={camera_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["current_risk"] == 35.0

        # 4. Fetch Dashboard Summary
        res = await client.get("/api/v1/dashboard/summary", headers=headers)
        assert res.status_code == 200
        summary = res.json()
        assert summary["active_cameras"] == 1
        assert summary["current_risk_level"] == "watch"
        assert summary["current_crowd_count"] == 150
