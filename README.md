# Smart Crowd Risk Analysis Platform

> AI-powered surveillance platform for real-time crowd monitoring, density analysis, motion intelligence, and risk prediction.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?logo=opencv)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

---

## 🎯 Overview

This platform analyzes CCTV video streams in real time to:

- **Monitor crowd density** across configurable zones
- **Track crowd movement** using optical flow algorithms
- **Detect anomalies** (stampedes, panic, overcrowding, counter-flow)
- **Predict risk levels** using a weighted scoring formula
- **Alert security** through dashboard, email, SMS, and WhatsApp
- **Visualize data** with an interactive dark-mode dashboard

### Target Deployments

Railway Stations • Airports • Shopping Malls • Temples • Stadiums • Colleges • Public Events • Smart Cities

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Tailwind + Recharts)                   │
│  ├── Overview Dashboard                                     │
│  ├── Live Camera Feeds (with overlays)                     │
│  ├── Analytics & Charts                                     │
│  └── Alert Management                                       │
├─────────────── WebSocket / REST API ────────────────────────┤
│  Backend (FastAPI + Uvicorn)                                │
│  ├── Auth & RBAC (JWT)                                     │
│  ├── Camera Management                                      │
│  ├── Alert Engine                                           │
│  └── AI Processing Pipeline                                 │
│      ├── Module 1: Image Enhancement (CLAHE, Filtering)     │
│      ├── Module 2: Crowd Segmentation (Otsu, Watershed)     │
│      ├── Module 3: Density Analysis (Heatmap, Hotspots)     │
│      ├── Module 4: Motion Intelligence (Optical Flow)       │
│      └── Module 5: Risk Prediction (Weighted Formula)       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  ├── Users, Cameras, Frames                                │
│  ├── DensityData, MotionData, RiskScores                   │
│  └── Alerts, Reports                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OR: Python 3.11+, Node.js 20+, PostgreSQL 16+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url> && cd cvproduct

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
# NGINX proxy: http://localhost:80
```

### Option 2: Local Development

```bash
# ── Backend ────────────────────────────────────
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Configure database
cp .env.example .env  # Edit DATABASE_URL

# Run the server
uvicorn app.main:app --reload --port 8000

# ── Frontend ───────────────────────────────────
cd frontend
npm install
npm run dev

# ── Seed Database ──────────────────────────────
python scripts/seed_db.py
```

### Default Credentials

| Role     | Username | Password    |
|----------|----------|-------------|
| Admin    | admin    | admin123    |
| Operator | operator | operator123 |

---

## 📊 Risk Prediction Formula

```
Risk Score = (0.35 × Density Score)
           + (0.25 × Congestion Score)
           + (0.25 × Motion Anomaly Score)
           + (0.15 × Speed Variance)
```

### Risk Levels

| Level | Range   | Action          |
|-------|---------|-----------------|
| Safe  | 0-25%   | Normal ops      |
| Watch | 25-50%  | Increased watch |
| Warning| 50-75% | Alert triggered |
| Critical| 75-100%| Immediate action|

---

## 🔌 API Endpoints

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | `/api/v1/auth/login`   | JWT authentication       |
| POST   | `/api/v1/auth/register`| User registration        |
| POST   | `/api/v1/camera/add`   | Add camera (admin)       |
| GET    | `/api/v1/camera/list`  | List all cameras         |
| POST   | `/api/v1/alert/create` | Create alert             |
| GET    | `/api/v1/alert/list`   | List alerts (filtered)   |
| GET    | `/api/v1/analytics/density` | Density trends      |
| GET    | `/api/v1/analytics/motion`  | Motion trends       |
| GET    | `/api/v1/analytics/risk`    | Risk trends         |
| GET    | `/api/v1/dashboard/summary` | Dashboard overview  |

### WebSocket Endpoints

| Endpoint                           | Data Type    |
|------------------------------------|-------------|
| `ws://host/ws/camera/{id}/feed`    | Binary JPEG |
| `ws://host/ws/camera/{id}/analytics`| JSON data  |
| `ws://host/ws/alerts`              | JSON alerts |

Full API docs: `http://localhost:8000/api/docs`

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend && python -m pytest tests/ -v

# Test AI pipeline
python scripts/test_pipeline.py

# Frontend build check
cd frontend && npm run build
```

---

## 📁 Project Structure

```
cvproduct/
├── backend/
│   ├── app/
│   │   ├── ai/              # AI processing modules (1-5)
│   │   ├── alerts/           # Alert engine (Module 6)
│   │   ├── api/              # REST API routes
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── websocket/        # WebSocket handlers
│   │   └── main.py           # FastAPI entry point
│   ├── tests/                # Unit tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript definitions
│   ├── Dockerfile
│   └── package.json
├── nginx/                    # Reverse proxy config
├── scripts/                  # Utility scripts
├── docker-compose.yml
└── README.md
```

---

## 🔧 Configuration

All settings are configurable via environment variables (`.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Database connection |
| `SECRET_KEY` | — | JWT signing key |
| `DENSITY_THRESHOLD_HIGH` | 70.0 | High density alert % |
| `DENSITY_THRESHOLD_CRITICAL` | 85.0 | Critical density alert % |
| `RISK_THRESHOLD_WARNING` | 50.0 | Warning risk score |
| `RISK_THRESHOLD_CRITICAL` | 75.0 | Critical risk score |
| `FRAME_PROCESS_INTERVAL` | 0.1 | Seconds between frames |
| `MAX_CAMERAS` | 16 | Maximum concurrent cameras |

---

## 📄 License

This project is developed for educational and research purposes.
