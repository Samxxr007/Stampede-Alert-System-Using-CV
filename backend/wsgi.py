"""
WSGI entry point - prevents Render Django auto-detection
"""
from app.main import app

application = app
