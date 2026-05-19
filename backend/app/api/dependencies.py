"""API dependencies — authentication, database session, etc."""

from typing import Optional
from uuid import UUID

from fastapi import Cookie, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import CredentialsException, PermissionDeniedException
from app.core.security import decode_token, needs_rehash, get_password_hash
from app.domain.models.user import User
from app.repositories.user_repository import UserRepository

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token_cookie: Optional[str] = Cookie(default=None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: validate JWT from Bearer header OR httpOnly cookie, return current user.

    Priority: Authorization header > access_token cookie.
    This allows both browser sessions (cookie) and API clients (Bearer) to work.
    """
    # Resolve token from header or cookie
    token: Optional[str] = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif access_token_cookie:
        token = access_token_cookie

    if not token:
        raise CredentialsException()

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise CredentialsException()

    user_id = payload.get("sub")
    if not user_id:
        raise CredentialsException()

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(user_id))

    if not user or not user.is_active:
        raise CredentialsException("User not found or inactive")

    # Transparent re-hash: upgrade legacy bcrypt passwords to Argon2id on next API call
    # (only possible if we have the plain password — done in AuthService.login instead)

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: ensures user is active."""
    if not current_user.is_active:
        raise CredentialsException("Inactive user")
    return current_user


async def get_current_superadmin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: ensures user is a superadmin."""
    if not current_user.is_superadmin:
        raise PermissionDeniedException("Superadmin access required")
    return current_user
