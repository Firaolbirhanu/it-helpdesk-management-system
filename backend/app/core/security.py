import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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
    expiry = timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, expiry, "access")


def create_refresh_token(data: dict, expires_days: int | None = None) -> str:
    expiry = timedelta(days=expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token = _create_token(data, expiry, "refresh")
    return token


def decode_access_token(token: str, expected_type: str | None = None) -> dict | None:
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