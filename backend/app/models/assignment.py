from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TicketAssignment(Base):
    __tablename__ = "ticket_assignments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False,
    )

    technician_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    assigned_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    unassigned_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    ticket = relationship(
        "Ticket",
        back_populates="assignments",
    )

    technician = relationship(
        "User",
        foreign_keys=[technician_id],
    )

    assigner = relationship(
        "User",
        foreign_keys=[assigned_by],
    )