from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class SLARule(Base):
    __tablename__ = "sla_rules"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    response_time_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    resolution_time_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )