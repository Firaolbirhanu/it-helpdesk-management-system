from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db

from app.models.status_history import TicketStatusHistory
from app.models.ticket import Ticket
from app.models.assignment import TicketAssignment
from app.models.user import User

from app.schemas.status_history import StatusHistoryResponse


router = APIRouter(
    prefix="/api/tickets",
    tags=["Ticket Status History"],
)


@router.get(
    "/{ticket_id}/history",
    response_model=list[StatusHistoryResponse],
)
def get_ticket_status_history(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find ticket
    ticket = db.get(
        Ticket,
        ticket_id,
    )

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # Employee can only view history of their own ticket
    if current_user.role.name == "Employee":
        if ticket.requester_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view history of your own tickets",
            )

    # Technician can only view history of assigned tickets
    elif current_user.role.name == "Technician":
        assignment = (
            db.query(TicketAssignment)
            .filter(
                TicketAssignment.ticket_id == ticket_id,
                TicketAssignment.technician_id == current_user.id,
                TicketAssignment.unassigned_at.is_(None),
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=403,
                detail="This ticket is not assigned to you",
            )

    history = (
        db.query(TicketStatusHistory)
        .filter(
            TicketStatusHistory.ticket_id == ticket_id
        )
        .order_by(
            TicketStatusHistory.changed_at.asc()
        )
        .all()
    )

    return history