from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    generate_secure_token,
    hash_refresh_token,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User


class AuthService:
    @staticmethod
    def revoke_all_tokens(db: Session, user_id: int) -> None:
        (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked.is_(False),
            )
            .update({RefreshToken.revoked: True}, synchronize_session=False)
        )
        db.commit()

    @staticmethod
    def issue_tokens(db: Session, user: User) -> dict:
        access_token = create_access_token({"sub": str(user.id), "role": user.role.name})
        refresh_token_value = generate_secure_token(48)
        expires_at = datetime.utcnow() + timedelta(days=7)

        existing_tokens = (
            db.query(RefreshToken)
            .filter(RefreshToken.user_id == user.id)
            .all()
        )
        for token_row in existing_tokens:
            token_row.revoked = True

        db.add(
            RefreshToken(
                user_id=user.id,
                token=hash_refresh_token(refresh_token_value),
                expires_at=expires_at,
                revoked=False,
            )
        )
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": 900,
        }

    @staticmethod
    def rotate_refresh_token(db: Session, refresh_token_value: str) -> dict:
        token_hash = hash_refresh_token(refresh_token_value)
        token_row = (
            db.query(RefreshToken)
            .filter(RefreshToken.token.in_([token_hash, refresh_token_value]))
            .first()
        )

        if token_row is None or token_row.revoked or token_row.is_expired:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or expired",
            )

        user = db.get(User, token_row.user_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        new_refresh_token_value = generate_secure_token(48)
        token_row.revoked = True
        token_row.replaced_by = hash_refresh_token(new_refresh_token_value)

        db.add(
            RefreshToken(
                user_id=user.id,
                token=hash_refresh_token(new_refresh_token_value),
                expires_at=datetime.utcnow() + timedelta(days=7),
                revoked=False,
            )
        )

        db.commit()

        return {
            "access_token": create_access_token({"sub": str(user.id), "role": user.role.name}),
            "refresh_token": new_refresh_token_value,
            "token_type": "bearer",
            "expires_in": 900,
        }

    @staticmethod
    def revoke_refresh_token(db: Session, refresh_token_value: str) -> None:
        token_hash = hash_refresh_token(refresh_token_value)
        token_row = (
            db.query(RefreshToken)
            .filter(RefreshToken.token.in_([token_hash, refresh_token_value]))
            .first()
        )
        if token_row is not None:
            token_row.revoked = True
            db.commit()
