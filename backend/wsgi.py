"""
WSGI entry point for Render deployment with gunicorn.
"""

from app.main import app

# Render expects an 'application' variable
application = app
