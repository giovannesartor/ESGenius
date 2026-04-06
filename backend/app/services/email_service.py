"""Email service — sends transactional emails via Resend."""

import logging
from typing import Optional

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Handles all outgoing transactional emails using Resend API."""

    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    async def send_verification_email(
        self, email: str, name: str, token: str
    ) -> None:
        """Send email verification link."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        await self._send_email(
            to=email,
            subject="Verify your ESG360 account",
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a2e;">Welcome to ESG360!</h1>
                <p>Hi {name},</p>
                <p>Thank you for creating your account. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666;">This link expires in 24 hours.</p>
                <p style="color: #666;">If you didn't create this account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">ESG360 — ESG Management Platform</p>
            </div>
            """,
        )

    async def send_password_reset_email(
        self, email: str, name: str, token: str
    ) -> None:
        """Send password reset link."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        await self._send_email(
            to=email,
            subject="Reset your ESG360 password",
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a2e;">Password Reset</h1>
                <p>Hi {name},</p>
                <p>We received a request to reset your password. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}"
                       style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666;">This link expires in 1 hour.</p>
                <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">ESG360 — ESG Management Platform</p>
            </div>
            """,
        )

    async def send_company_invite_email(
        self, email: str, company_name: str, role: str, inviter_name: str
    ) -> None:
        """Send company invitation email."""
        invite_url = f"{settings.FRONTEND_URL}/accept-invite"

        await self._send_email(
            to=email,
            subject=f"You've been invited to {company_name} on ESG360",
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a2e;">You've been invited!</h1>
                <p>{inviter_name} has invited you to join <strong>{company_name}</strong> as a <strong>{role}</strong> on ESG360.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{invite_url}"
                       style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Accept Invitation
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">ESG360 — ESG Management Platform</p>
            </div>
            """,
        )

    async def _send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None,
    ) -> None:
        """Send email using Resend API."""
        if not settings.RESEND_API_KEY:
            logger.warning(
                f"RESEND_API_KEY not configured. Email to {to} not sent: {subject}"
            )
            return

        try:
            params: resend.Emails.SendParams = {
                "from": from_email or f"ESG360 <{settings.EMAIL_FROM}>",
                "to": [to],
                "subject": subject,
                "html": html,
            }
            resend.Emails.send(params)
            logger.info(f"Email sent to {to}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            # Don't raise — email failure shouldn't block auth
