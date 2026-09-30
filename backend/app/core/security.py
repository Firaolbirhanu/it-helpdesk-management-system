import secrets
import hashlib

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError("Password cannot be longer than 72 bytes")

    return bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")

    if len(password_bytes) > 72:
        return False

    return bcrypt.checkpw(
        password_bytes,
        hashed_password.encode("utf-8")
    )


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()

    issued_at = datetime.now(timezone.utc)
    expire = issued_at + expires_delta

    to_encode.update({
        "exp": expire,
        "iat": issued_at,
        "nbf": issued_at,
        "token_type": token_type,
    })

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    expiry = timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return _create_token(data, expiry, "access")


def create_refresh_token(data: dict, expires_days: int | None = None) -> str:
    expiry = timedelta(
        days=expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    return _create_token(data, expiry, "refresh")


def decode_access_token(
    token: str,
    expected_type: str | None = None
) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        if expected_type and payload.get("token_type") != expected_type:
            return None

        return payload

    except JWTError:
        return None


def generate_secure_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()