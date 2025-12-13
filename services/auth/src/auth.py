"""
Authentication utilities and JWT handling
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, status
import secrets
import hashlib

from .config_local import AuthSettings
from .schemas import TokenData

settings = AuthSettings()


def get_password_hash(password: str) -> str:
    """Generate SHA256 password hash"""
    # Add salt to the password
    salted_password = password + settings.JWT_SECRET
    # Hash with SHA256
    return hashlib.sha256(salted_password.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its SHA256 hash"""
    # Hash the provided password with the same salt
    salted_password = plain_password + settings.JWT_SECRET
    computed_hash = hashlib.sha256(salted_password.encode('utf-8')).hexdigest()
    # Compare hashes
    return computed_hash == hashed_password


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: str, tenant_id: str) -> str:
    """Create a secure refresh token"""
    # Generate a cryptographically secure random token
    return secrets.token_urlsafe(32)


def verify_token(token: str) -> TokenData:
    """Verify JWT token and return token data"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        role_id: str = payload.get("role_id")
        permissions: list = payload.get("permissions", [])
        exp: Optional[datetime] = payload.get("exp")

        if user_id is None or tenant_id is None or role_id is None:
            raise credentials_exception

        token_data = TokenData(
            user_id=user_id,
            tenant_id=tenant_id,
            role_id=role_id,
            permissions=permissions,
            exp=exp
        )
        return token_data
    except JWTError:
        raise credentials_exception


def generate_password_reset_token(email: str) -> str:
    """Generate password reset token"""
    delta = timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token"""
    try:
        decoded_token = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return decoded_token["sub"]
    except JWTError:
        return None


def is_token_expired(exp: Optional[datetime]) -> bool:
    """Check if token has expired"""
    if not exp:
        return False

    return datetime.utcnow() > exp


def check_user_lockout(
    login_attempts: int,
    locked_until: Optional[datetime],
    max_attempts: int = None,
    lockout_duration: int = None
) -> tuple[bool, Optional[int]]:
    """
    Check if user is locked out and return lockout status
    Returns: (is_locked, remaining_minutes)
    """
    max_attempts = max_attempts or settings.MAX_LOGIN_ATTEMPTS
    lockout_duration = lockout_duration or settings.LOCKOUT_DURATION_MINUTES

    # Check if user is currently locked
    if locked_until and datetime.utcnow() < locked_until:
        remaining = (locked_until - datetime.utcnow()).seconds // 60
        return True, remaining

    # Check if lockout should be applied
    if login_attempts >= max_attempts:
        return True, lockout_duration

    return False, None


def increment_login_attempts(login_attempts: int) -> int:
    """Increment login attempts counter"""
    return login_attempts + 1


def reset_login_attempts() -> int:
    """Reset login attempts counter"""
    return 0


def create_email_verification_token(email: str) -> str:
    """Create email verification token"""
    delta = timedelta(hours=EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "email_verification"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_email_verification_token(token: str) -> Optional[str]:
    """Verify email verification token"""
    try:
        decoded_token = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

        # Check token type
        if decoded_token.get("type") != "email_verification":
            return None

        return decoded_token["sub"]
    except JWTError:
        return None


# Default values for missing settings
RESET_TOKEN_EXPIRE_HOURS = 1
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = 24