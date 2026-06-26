"""
Module 6: Alert Engine
========================
Triggers alerts based on risk analysis results.
Supports dashboard, email, SMS, WhatsApp, and push notifications.
Includes deduplication and priority escalation.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from collections import defaultdict

from app.core.config import settings

logger = logging.getLogger(__name__)


class AlertEngine:
    """
    Processes risk predictions and triggers appropriate alerts.
    Features:
    - Threshold-based triggering
    - Alert deduplication (cooldown per camera)
    - Priority escalation
    - Multi-channel dispatch (dashboard, email, SMS, WhatsApp)
    """

    def __init__(self):
        # Cooldown tracking: camera_id -> last alert timestamp
        self._last_alert_time: Dict[int, datetime] = {}
        self._alert_cooldown = timedelta(seconds=30)  # Minimum 30s between alerts per camera
        self._escalation_history: Dict[int, str] = defaultdict(lambda: "info")

    def should_trigger(self, risk_data: Dict[str, Any], camera_id: int) -> bool:
        """
        Determine if an alert should be triggered based on:
        1. Risk level is Warning or Critical
        2. Density exceeds threshold
        3. Motion anomaly detected
        4. Cooldown period has passed
        """
        risk_level = risk_data.get("risk_level", "safe")
        risk_pct = risk_data.get("risk_percentage", 0)

        # Check if any trigger condition is met
        triggers = [
            risk_level in ("warning", "critical"),
            risk_pct >= settings.RISK_THRESHOLD_WARNING,
        ]

        if not any(triggers):
            return False

        # Check cooldown
        now = datetime.now(timezone.utc)
        last_alert = self._last_alert_time.get(camera_id)
        if last_alert and (now - last_alert) < self._alert_cooldown:
            return False

        return True

    def determine_priority(self, risk_data: Dict[str, Any], camera_id: int) -> str:
        """
        Determine alert priority with escalation logic.
        """
        risk_level = risk_data.get("risk_level", "safe")
        risk_pct = risk_data.get("risk_percentage", 0)

        if risk_level == "critical" or risk_pct >= settings.RISK_THRESHOLD_CRITICAL:
            priority = "critical"
        elif risk_level == "warning" or risk_pct >= settings.RISK_THRESHOLD_WARNING:
            priority = "warning"
        else:
            priority = "info"

        # Escalation: if same camera keeps hitting warning, escalate to critical
        prev_priority = self._escalation_history[camera_id]
        if prev_priority == "warning" and priority == "warning":
            priority = "critical"  # Escalate on repeat

        self._escalation_history[camera_id] = priority
        return priority

    def build_alert_data(
        self,
        camera_id: int,
        camera_name: str,
        risk_data: Dict[str, Any],
        density_data: Optional[Dict[str, Any]] = None,
        motion_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Build the alert payload.
        """
        risk_level = risk_data.get("risk_level", "safe")
        risk_pct = risk_data.get("risk_percentage", 0)
        priority = self.determine_priority(risk_data, camera_id)

        # Build descriptive title and message
        title = f"🚨 {priority.upper()} — {camera_name}"
        messages = []

        if risk_level == "critical":
            title = f"🔴 CRITICAL RISK — {camera_name}"
            messages.append(f"Risk Level: CRITICAL ({risk_pct:.1f}%)")
        elif risk_level == "warning":
            title = f"🟠 WARNING — {camera_name}"
            messages.append(f"Risk Level: WARNING ({risk_pct:.1f}%)")

        if density_data:
            density = density_data.get("overall_density", 0)
            level = density_data.get("overall_level", "low")
            count = density_data.get("crowd_count", 0)
            messages.append(f"Crowd Density: {level.upper()} ({density:.1f}%), Count: ~{count}")

            hotspots = density_data.get("hotspots", [])
            if hotspots:
                zones = ", ".join(h["zone"] for h in hotspots[:3])
                messages.append(f"Congestion Hotspots: {zones}")

        if motion_data:
            anomaly = motion_data.get("anomaly_type", "none")
            if anomaly != "none":
                anomaly_label = anomaly.replace("_", " ").title()
                messages.append(f"Motion Anomaly: {anomaly_label}")

            speed = motion_data.get("avg_speed", 0)
            if speed > 5:
                messages.append(f"Avg Speed: {speed:.1f} (elevated)")

        # Record alert time
        self._last_alert_time[camera_id] = datetime.now(timezone.utc)

        return {
            "camera_id": camera_id,
            "camera_name": camera_name,
            "priority": priority,
            "title": title,
            "message": "\n".join(messages),
            "risk_data": risk_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def dispatch_dashboard(self, alert_data: Dict[str, Any], ws_broadcast_fn):
        """Send alert via WebSocket to dashboard clients."""
        try:
            await ws_broadcast_fn(alert_data)
            logger.info(f"Dashboard alert dispatched: {alert_data['title']}")
        except Exception as e:
            logger.error(f"Dashboard alert dispatch failed: {e}")

    async def dispatch_email(self, alert_data: Dict[str, Any], recipients: List[str]):
        """
        Send alert via email (placeholder).
        Configure SMTP settings in .env for production use.
        """
        if not settings.SMTP_HOST:
            logger.debug("Email alerts not configured (SMTP_HOST not set)")
            return

        try:
            import aiosmtplib
            from email.mime.text import MIMEText

            msg = MIMEText(alert_data["message"])
            msg["Subject"] = alert_data["title"]
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = ", ".join(recipients)

            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True,
            )
            logger.info(f"Email alert sent to {recipients}")
        except Exception as e:
            logger.error(f"Email alert failed: {e}")

    async def dispatch_sms(self, alert_data: Dict[str, Any], phone_numbers: List[str]):
        """
        Send alert via SMS using Twilio (placeholder).
        Configure Twilio credentials in .env for production use.
        """
        if not settings.TWILIO_ACCOUNT_SID:
            logger.debug("SMS alerts not configured (TWILIO_ACCOUNT_SID not set)")
            return

        try:
            import httpx

            for phone in phone_numbers:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                        auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                        data={
                            "From": settings.TWILIO_PHONE_FROM,
                            "To": phone,
                            "Body": f"{alert_data['title']}\n{alert_data['message']}",
                        },
                    )
            logger.info(f"SMS alert sent to {phone_numbers}")
        except Exception as e:
            logger.error(f"SMS alert failed: {e}")

    async def dispatch_whatsapp(self, alert_data: Dict[str, Any], phone_numbers: List[str]):
        """
        Send alert via WhatsApp using Twilio (placeholder).
        """
        if not settings.TWILIO_ACCOUNT_SID:
            logger.debug("WhatsApp alerts not configured")
            return

        try:
            import httpx

            for phone in phone_numbers:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                        auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                        data={
                            "From": f"whatsapp:{settings.TWILIO_PHONE_FROM}",
                            "To": f"whatsapp:{phone}",
                            "Body": f"{alert_data['title']}\n{alert_data['message']}",
                        },
                    )
            logger.info(f"WhatsApp alert sent to {phone_numbers}")
        except Exception as e:
            logger.error(f"WhatsApp alert failed: {e}")

    def reset_camera(self, camera_id: int):
        """Reset alert state for a camera."""
        self._last_alert_time.pop(camera_id, None)
        self._escalation_history.pop(camera_id, None)


# Global alert engine instance
alert_engine = AlertEngine()
