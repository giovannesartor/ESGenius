"""Auth API endpoints."""

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import BadRequestException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.schemas.auth import (
    EmailVerification,
    MessageResponse,
    PasswordChange,
    PasswordReset,
    PasswordResetRequest,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(
    request: Request,
    data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user with email and password."""
    service = AuthService(db)
    return await service.register(
        email=data.email, password=data.password, full_name=data.full_name
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password."""
    service = AuthService(db)
    return await service.login(email=data.email, password=data.password)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh_token(request: Request, data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    service = AuthService(db)
    return await service.refresh_token(data.refresh_token)


@router.post("/verify-email", response_model=UserResponse)
async def verify_email(
    data: EmailVerification, db: AsyncSession = Depends(get_db)
):
    """Verify email address using the token sent via email."""
    service = AuthService(db)
    return await service.verify_email(data.token)


@router.post("/password-reset/request", response_model=MessageResponse)
@limiter.limit("5/minute")
async def request_password_reset(
    request: Request,
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request a password reset email."""
    service = AuthService(db)
    await service.request_password_reset(data.email)
    return MessageResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def reset_password(
    data: PasswordReset, db: AsyncSession = Depends(get_db)
):
    """Reset password using the token from email."""
    service = AuthService(db)
    await service.reset_password(token=data.token, new_password=data.new_password)
    return MessageResponse(message="Password has been reset successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for authenticated user."""
    service = AuthService(db)
    await service.change_password(
        user_id=current_user.id,
        current_password=data.current_password,
        new_password=data.new_password,
    )
    return MessageResponse(message="Password changed successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    service = AuthService(db)
    return await service.get_current_user(current_user.id)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    from app.repositories.user_repository import UserRepository

    user_repo = UserRepository(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    user = await user_repo.update(current_user)
    return UserResponse.model_validate(user)


# --- Google OAuth ---
@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth consent screen."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return {"authorization_url": url}


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback — redirects to frontend with tokens."""
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                },
            )
            token_data = token_response.json()

            if "error" in token_data or "access_token" not in token_data:
                error_msg = token_data.get("error_description", token_data.get("error", "unknown"))
                return RedirectResponse(
                    url=f"{frontend_base}/login?error={urlencode({'e': error_msg})}"
                )

            # Get user info
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            userinfo = userinfo_response.json()

            if "error" in userinfo or "email" not in userinfo:
                return RedirectResponse(
                    url=f"{frontend_base}/login?error=google_userinfo_failed"
                )

        service = AuthService(db)
        tokens = await service.google_auth(
            google_id=userinfo["id"],
            email=userinfo["email"],
            full_name=userinfo.get("name", userinfo["email"]),
            avatar_url=userinfo.get("picture"),
        )

        # Redirect to frontend callback page with tokens in hash fragment (not exposed to server logs)
        params = urlencode({
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
        })
        return RedirectResponse(url=f"{frontend_base}/auth/callback#{params}")

    except Exception:
        return RedirectResponse(url=f"{frontend_base}/login?error=google_auth_failed")
