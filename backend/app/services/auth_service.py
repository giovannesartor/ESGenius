"""Auth service — handles authentication, registration, and token management."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    CredentialsException,
    NotFoundException,
)
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.domain.models.user import AuthProvider, User
from app.domain.schemas.auth import TokenResponse, UserResponse
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService


class AuthService:
    """Handles all authentication business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.email_service = EmailService()

    async def register(
        self, email: str, password: str, full_name: str
    ) -> UserResponse:
        """Register a new user with email/password."""
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictException("User with this email already exists")

        verification_token = create_email_verification_token(email)

        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            auth_provider=AuthProvider.LOCAL.value,
            email_verification_token=verification_token,
        )
        user = await self.user_repo.create(user)

        # Send verification email
        await self.email_service.send_verification_email(
            email=email,
            name=full_name,
            token=verification_token,
        )

        return UserResponse.model_validate(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user with email/password and return tokens."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise CredentialsException("Invalid email or password")

        if user.auth_provider != AuthProvider.LOCAL.value:
            raise BadRequestException(
                f"This account uses {user.auth_provider} login"
            )

        if not user.hashed_password or not verify_password(
            password, user.hashed_password
        ):
            raise CredentialsException("Invalid email or password")

        if not user.is_active:
            raise CredentialsException("Account is deactivated")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.user_repo.update(user)

        return self._create_token_response(user)

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Generate new access token using refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise CredentialsException("Invalid refresh token")

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise CredentialsException("User not found or inactive")

        return self._create_token_response(user)

    async def verify_email(self, token: str) -> UserResponse:
        """Verify user's email using the verification token."""
        payload = decode_token(token)
        if not payload or payload.get("type") != "email_verification":
            raise BadRequestException("Invalid or expired verification token")

        email = payload.get("sub")
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found")

        user.is_email_verified = True
        user.email_verification_token = None
        user = await self.user_repo.update(user)

        return UserResponse.model_validate(user)

    async def request_password_reset(self, email: str) -> None:
        """Send password reset email."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            return  # Don't reveal if user exists

        token = create_password_reset_token(email)
        user.password_reset_token = token
        await self.user_repo.update(user)

        await self.email_service.send_password_reset_email(
            email=email,
            name=user.full_name,
            token=token,
        )

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using the reset token."""
        payload = decode_token(token)
        if not payload or payload.get("type") != "password_reset":
            raise BadRequestException("Invalid or expired reset token")

        email = payload.get("sub")
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundException("User not found")

        user.hashed_password = get_password_hash(new_password)
        user.password_reset_token = None
        await self.user_repo.update(user)

    async def change_password(
        self, user_id: UUID, current_password: str, new_password: str
    ) -> None:
        """Change password for authenticated user."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        if not verify_password(current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")

        user.hashed_password = get_password_hash(new_password)
        await self.user_repo.update(user)

    async def google_auth(
        self, google_id: str, email: str, full_name: str, avatar_url: Optional[str]
    ) -> TokenResponse:
        """Authenticate or register user via Google OAuth."""
        # Check if user exists by google_id
        user = await self.user_repo.get_by_google_id(google_id)
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            await self.user_repo.update(user)
            return self._create_token_response(user)

        # Check if user exists by email
        user = await self.user_repo.get_by_email(email)
        if user:
            # Link Google account to existing user
            user.google_id = google_id
            user.auth_provider = AuthProvider.GOOGLE.value
            user.is_email_verified = True
            user.avatar_url = avatar_url or user.avatar_url
            user.last_login_at = datetime.now(timezone.utc)
            await self.user_repo.update(user)
            return self._create_token_response(user)

        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            auth_provider=AuthProvider.GOOGLE.value,
            google_id=google_id,
            avatar_url=avatar_url,
            is_email_verified=True,
        )
        user = await self.user_repo.create(user)
        user.last_login_at = datetime.now(timezone.utc)
        await self.user_repo.update(user)

        return self._create_token_response(user)

    async def get_current_user(self, user_id: UUID) -> UserResponse:
        """Get current authenticated user profile."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return UserResponse.model_validate(user)

    def _create_token_response(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for a user."""
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email},
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
