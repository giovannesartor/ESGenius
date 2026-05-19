"""Email service — sends transactional emails via Resend in the user's language."""

import asyncio
import logging
from typing import Literal, Optional

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

Lang = Literal["en", "pt", "es"]

# ---------------------------------------------------------------------------
# Template helpers
# ---------------------------------------------------------------------------

def _base_html(title: str, body: str, footer: str) -> str:
    """Wrap body content in a common branded layout."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 24px 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.3px;">ESG360</h1>
      </div>
      <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">{title}</h2>
        {body}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;">
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">{footer}</p>
      </div>
    </div>
    """


def _button(url: str, label: str) -> str:
    return (
        f'<div style="text-align: center; margin: 28px 0;">'
        f'<a href="{url}" style="background-color: #16a34a; color: white; padding: 14px 32px; '
        f'text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">'
        f'{label}</a></div>'
    )


# ---------------------------------------------------------------------------
# Verification email
# ---------------------------------------------------------------------------

_VERIFICATION_SUBJECTS: dict[Lang, str] = {
    "en": "Verify your ESG360 account",
    "pt": "Verifique sua conta ESG360",
    "es": "Verifica tu cuenta de ESG360",
}

_VERIFICATION_TEMPLATES: dict[Lang, tuple[str, str, str]] = {
    # (title, body_html, footer)
    "en": (
        "Welcome to ESG360!",
        "<p style='color:#374151;'>Thank you for creating your account. Please verify your email address by clicking the button below:</p>"
        "<p style='color:#6b7280; font-size:13px;'>This link expires in <strong>24 hours</strong>. If you didn't create this account, please ignore this email.</p>",
        "ESG360 — AI-Powered ESG Reporting Platform",
    ),
    "pt": (
        "Bem-vindo(a) ao ESG360!",
        "<p style='color:#374151;'>Obrigado por criar sua conta. Verifique seu endereço de e-mail clicando no botão abaixo:</p>"
        "<p style='color:#6b7280; font-size:13px;'>Este link expira em <strong>24 horas</strong>. Se você não criou esta conta, ignore este e-mail.</p>",
        "ESG360 — Plataforma de Relatórios ESG com IA",
    ),
    "es": (
        "¡Bienvenido a ESG360!",
        "<p style='color:#374151;'>Gracias por crear tu cuenta. Verifica tu dirección de correo haciendo clic en el botón de abajo:</p>"
        "<p style='color:#6b7280; font-size:13px;'>Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este correo.</p>",
        "ESG360 — Plataforma de Informes ESG con IA",
    ),
}

_VERIFICATION_BUTTON_LABELS: dict[Lang, str] = {
    "en": "Verify Email Address",
    "pt": "Verificar Endereço de E-mail",
    "es": "Verificar Dirección de Correo",
}

# ---------------------------------------------------------------------------
# Password reset email
# ---------------------------------------------------------------------------

_RESET_SUBJECTS: dict[Lang, str] = {
    "en": "Reset your ESG360 password",
    "pt": "Redefinir sua senha do ESG360",
    "es": "Restablece tu contraseña de ESG360",
}

_RESET_TEMPLATES: dict[Lang, tuple[str, str, str]] = {
    "en": (
        "Password Reset",
        "<p style='color:#374151;'>We received a request to reset your password. Click the button below to set a new password:</p>"
        "<p style='color:#6b7280; font-size:13px;'>This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>",
        "ESG360 — AI-Powered ESG Reporting Platform",
    ),
    "pt": (
        "Redefinição de Senha",
        "<p style='color:#374151;'>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>"
        "<p style='color:#6b7280; font-size:13px;'>Este link expira em <strong>1 hora</strong>. Se você não solicitou isso, ignore este e-mail.</p>",
        "ESG360 — Plataforma de Relatórios ESG com IA",
    ),
    "es": (
        "Restablecimiento de Contraseña",
        "<p style='color:#374151;'>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para establecer una nueva contraseña:</p>"
        "<p style='color:#6b7280; font-size:13px;'>Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>",
        "ESG360 — Plataforma de Informes ESG con IA",
    ),
}

_RESET_BUTTON_LABELS: dict[Lang, str] = {
    "en": "Reset Password",
    "pt": "Redefinir Senha",
    "es": "Restablecer Contraseña",
}

# ---------------------------------------------------------------------------
# Report completed email
# ---------------------------------------------------------------------------

_REPORT_SUBJECTS: dict[Lang, str] = {
    "en": "Your ESG report '{title}' is ready",
    "pt": "Seu relatório ESG '{title}' está pronto",
    "es": "Tu informe ESG '{title}' está listo",
}

_REPORT_TEMPLATES: dict[Lang, tuple[str, str, str]] = {
    "en": (
        "✅ Report Ready",
        "<p style='color:#374151;'>Your ESG report <strong>\"{report_title}\"</strong> for <strong>{company_name}</strong> "
        "has been generated successfully and is ready for download.</p>",
        "ESG360 — AI-Powered ESG Reporting Platform",
    ),
    "pt": (
        "✅ Relatório Pronto",
        "<p style='color:#374151;'>Seu relatório ESG <strong>\"{report_title}\"</strong> para <strong>{company_name}</strong> "
        "foi gerado com sucesso e está disponível para download.</p>",
        "ESG360 — Plataforma de Relatórios ESG com IA",
    ),
    "es": (
        "✅ Informe Listo",
        "<p style='color:#374151;'>Tu informe ESG <strong>\"{report_title}\"</strong> para <strong>{company_name}</strong> "
        "se ha generado exitosamente y está listo para descargar.</p>",
        "ESG360 — Plataforma de Informes ESG con IA",
    ),
}

_REPORT_BUTTON_LABELS: dict[Lang, str] = {
    "en": "View Report",
    "pt": "Ver Relatório",
    "es": "Ver Informe",
}

# ---------------------------------------------------------------------------
# Document processed email
# ---------------------------------------------------------------------------

_DOC_SUBJECTS: dict[Lang, str] = {
    "en": "Document '{name}' processed — {count} ESG data points found",
    "pt": "Documento '{name}' processado — {count} pontos de dados ESG encontrados",
    "es": "Documento '{name}' procesado — {count} puntos de datos ESG encontrados",
}

_DOC_TEMPLATES: dict[Lang, tuple[str, str, str]] = {
    "en": (
        "📄 Document Processed",
        "<p style='color:#374151;'>Your document <strong>\"{doc_name}\"</strong> for <strong>{company_name}</strong> "
        "has been analyzed by our AI engine.</p>"
        "<div style='background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:20px; margin:20px 0; text-align:center;'>"
        "<div style='font-size:36px; font-weight:bold; color:#16a34a;'>{count}</div>"
        "<div style='color:#374151; font-weight:500;'>ESG data points extracted</div></div>",
        "ESG360 — AI-Powered ESG Reporting Platform",
    ),
    "pt": (
        "📄 Documento Processado",
        "<p style='color:#374151;'>Seu documento <strong>\"{doc_name}\"</strong> para <strong>{company_name}</strong> "
        "foi analisado pelo nosso motor de IA.</p>"
        "<div style='background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:20px; margin:20px 0; text-align:center;'>"
        "<div style='font-size:36px; font-weight:bold; color:#16a34a;'>{count}</div>"
        "<div style='color:#374151; font-weight:500;'>pontos de dados ESG extraídos</div></div>",
        "ESG360 — Plataforma de Relatórios ESG com IA",
    ),
    "es": (
        "📄 Documento Procesado",
        "<p style='color:#374151;'>Tu documento <strong>\"{doc_name}\"</strong> para <strong>{company_name}</strong> "
        "ha sido analizado por nuestro motor de IA.</p>"
        "<div style='background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:20px; margin:20px 0; text-align:center;'>"
        "<div style='font-size:36px; font-weight:bold; color:#16a34a;'>{count}</div>"
        "<div style='color:#374151; font-weight:500;'>puntos de datos ESG extraídos</div></div>",
        "ESG360 — Plataforma de Informes ESG con IA",
    ),
}

_DOC_BUTTON_LABELS: dict[Lang, str] = {
    "en": "View Documents",
    "pt": "Ver Documentos",
    "es": "Ver Documentos",
}

# ---------------------------------------------------------------------------
# Company invite email
# ---------------------------------------------------------------------------

_INVITE_SUBJECTS: dict[Lang, str] = {
    "en": "You've been invited to {company} on ESG360",
    "pt": "Você foi convidado para {company} no ESG360",
    "es": "Te han invitado a {company} en ESG360",
}

_INVITE_TEMPLATES: dict[Lang, tuple[str, str, str]] = {
    "en": (
        "You've been invited!",
        "<p style='color:#374151;'><strong>{inviter}</strong> has invited you to join "
        "<strong>{company}</strong> as a <strong>{role}</strong> on ESG360.</p>"
        "<p style='color:#6b7280; font-size:13px;'>This invitation expires in 7 days.</p>",
        "ESG360 — AI-Powered ESG Reporting Platform",
    ),
    "pt": (
        "Você foi convidado!",
        "<p style='color:#374151;'><strong>{inviter}</strong> convidou você para entrar na "
        "<strong>{company}</strong> como <strong>{role}</strong> no ESG360.</p>"
        "<p style='color:#6b7280; font-size:13px;'>Este convite expira em 7 dias.</p>",
        "ESG360 — Plataforma de Relatórios ESG com IA",
    ),
    "es": (
        "¡Te han invitado!",
        "<p style='color:#374151;'><strong>{inviter}</strong> te ha invitado a unirte a "
        "<strong>{company}</strong> como <strong>{role}</strong> en ESG360.</p>"
        "<p style='color:#6b7280; font-size:13px;'>Esta invitación expira en 7 días.</p>",
        "ESG360 — Plataforma de Informes ESG con IA",
    ),
}

_INVITE_BUTTON_LABELS: dict[Lang, str] = {
    "en": "Accept Invitation",
    "pt": "Aceitar Convite",
    "es": "Aceptar Invitación",
}


# ---------------------------------------------------------------------------
# EmailService
# ---------------------------------------------------------------------------

class EmailService:
    """Handles all outgoing transactional emails using Resend API."""

    def __init__(self) -> None:
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    # ── Public methods ────────────────────────────────────────────────────

    async def send_verification_email(
        self, email: str, name: str, token: str, language: Lang = "en"
    ) -> None:
        """Send email verification link in the user's language."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        lang = self._resolve_lang(language)
        subject = _VERIFICATION_SUBJECTS[lang]
        title, body, footer = _VERIFICATION_TEMPLATES[lang]
        html = _base_html(
            title,
            f"<p style='color:#374151;'>Hi {name},</p>" + body + _button(verification_url, _VERIFICATION_BUTTON_LABELS[lang]),
            footer,
        )
        text = (
            f"Hi {name},\n\n"
            f"Verify your email address: {verification_url}\n\n"
            f"This link expires in 24 hours.\n\n{footer}"
        )
        await self._send_email(to=email, subject=subject, html=html, text=text)

    async def send_password_reset_email(
        self, email: str, name: str, token: str, language: Lang = "en"
    ) -> None:
        """Send password reset link in the user's language."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        lang = self._resolve_lang(language)
        subject = _RESET_SUBJECTS[lang]
        title, body, footer = _RESET_TEMPLATES[lang]
        html = _base_html(
            title,
            f"<p style='color:#374151;'>Hi {name},</p>" + body + _button(reset_url, _RESET_BUTTON_LABELS[lang]),
            footer,
        )
        text = (
            f"Hi {name},\n\n"
            f"Reset your password: {reset_url}\n\n"
            f"This link expires in 1 hour.\n\n{footer}"
        )
        await self._send_email(to=email, subject=subject, html=html, text=text)

    async def send_company_invite_email(
        self,
        email: str,
        company_name: str,
        role: str,
        inviter_name: str,
        invite_token: str,
        language: Lang = "en",
    ) -> None:
        """Send company invitation email with a signed token."""
        invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={invite_token}"
        lang = self._resolve_lang(language)
        subject = _INVITE_SUBJECTS[lang].format(company=company_name)
        title, body_tpl, footer = _INVITE_TEMPLATES[lang]
        body = body_tpl.format(inviter=inviter_name, company=company_name, role=role)
        html = _base_html(
            title,
            body + _button(invite_url, _INVITE_BUTTON_LABELS[lang]),
            footer,
        )
        text = (
            f"{inviter_name} invited you to {company_name} as {role}.\n\n"
            f"Accept invitation: {invite_url}\n\n{footer}"
        )
        await self._send_email(to=email, subject=subject, html=html, text=text)

    async def send_report_completed_email(
        self,
        email: str,
        name: str,
        report_title: str,
        company_name: str,
        language: Lang = "en",
    ) -> None:
        """Send notification when ESG report is ready."""
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard/reports"
        lang = self._resolve_lang(language)
        subject = _REPORT_SUBJECTS[lang].format(title=report_title)
        title, body_tpl, footer = _REPORT_TEMPLATES[lang]
        body = body_tpl.format(report_title=report_title, company_name=company_name)
        html = _base_html(
            title,
            f"<p style='color:#374151;'>Hi {name},</p>" + body + _button(dashboard_url, _REPORT_BUTTON_LABELS[lang]),
            footer,
        )
        text = (
            f"Hi {name},\n\n"
            f"Your ESG report '{report_title}' for {company_name} is ready.\n\n"
            f"View it here: {dashboard_url}\n\n{footer}"
        )
        await self._send_email(to=email, subject=subject, html=html, text=text)

    async def send_document_processed_email(
        self,
        email: str,
        name: str,
        document_name: str,
        company_name: str,
        data_points_found: int,
        language: Lang = "en",
    ) -> None:
        """Send notification when a document has been processed."""
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard/documents"
        lang = self._resolve_lang(language)
        subject = _DOC_SUBJECTS[lang].format(name=document_name, count=data_points_found)
        title, body_tpl, footer = _DOC_TEMPLATES[lang]
        body = body_tpl.format(doc_name=document_name, company_name=company_name, count=data_points_found)
        html = _base_html(
            title,
            f"<p style='color:#374151;'>Hi {name},</p>" + body + _button(dashboard_url, _DOC_BUTTON_LABELS[lang]),
            footer,
        )
        text = (
            f"Hi {name},\n\n"
            f"Your document '{document_name}' for {company_name} has been processed. "
            f"{data_points_found} ESG data points were extracted.\n\n"
            f"View: {dashboard_url}\n\n{footer}"
        )
        await self._send_email(to=email, subject=subject, html=html, text=text)

    # ── Private helpers ───────────────────────────────────────────────────

    @staticmethod
    def _resolve_lang(language: str) -> Lang:
        """Normalize language code to a supported Lang, defaulting to 'en'."""
        code = (language or "en").split("-")[0].lower()
        return code if code in ("en", "pt", "es") else "en"  # type: ignore[return-value]

    async def _send_email(
        self,
        to: str,
        subject: str,
        html: str,
        text: str = "",
        from_email: Optional[str] = None,
    ) -> None:
        """Send email using Resend API (executed in a thread to avoid blocking the event loop)."""
        if not settings.RESEND_API_KEY:
            logger.warning(
                "RESEND_API_KEY not configured. Email to %s not sent: %s", to, subject
            )
            return

        params: resend.Emails.SendParams = {
            "from": from_email or f"ESG360 <{settings.EMAIL_FROM}>",
            "to": [to],
            "subject": subject,
            "html": html,
            "text": text,
        }

        try:
            # resend.Emails.send is synchronous — run in thread pool to avoid blocking.
            await asyncio.to_thread(resend.Emails.send, params)
            logger.info("Email sent to %s: %s", to, subject)
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to, exc)
            # Don't raise — email failure should not block auth flows.
