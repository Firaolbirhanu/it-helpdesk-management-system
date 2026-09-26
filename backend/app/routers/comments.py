from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db

from app.models.comment import TicketComment
from app.models.ticket import Ticket
from app.models.assignment import TicketAssignment
from app.models.user import User

from app.schemas.comment import (
    CommentCreate,
    CommentResponse,
)
from app.services.audit import record_audit_event


router = APIRouter(
    prefix="/api/tickets",
    tags=["Ticket Comments"],
)


@router.post(
    "/{ticket_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    ticket_id: int,
    comment_data: CommentCreate,
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Employees can comment only on their own tickets
    if current_user.role.name == "Employee":
        if ticket.requester_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only comment on your own tickets",
            )

    # Technicians can comment only on tickets assigned to them
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
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This ticket is not assigned to you",
            )

    # Administrators can comment on any ticket

    # Prevent empty comments
    if not comment_data.comment.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty",
        )

    new_comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        comment=comment_data.comment.strip(),
    )

    db.add(new_comment)
    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="COMMENT",
        entity_type="Ticket",
        entity_id=ticket.id,
        new_value="Comment added",
    )
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.get(
    "/{ticket_id}/comments",
    response_model=list[CommentResponse],
)
def get_ticket_comments(
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Employee can view comments only on own ticket
    if current_user.role.name == "Employee":
        if ticket.requester_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view comments on your own tickets",
            )

    # Technician can view comments only on assigned ticket
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
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This ticket is not assigned to you",
            )

    comments = (
        db.query(TicketComment)
        .filter(
            TicketComment.ticket_id == ticket_id
        )
        .order_by(
            TicketComment.created_at.asc()
        )
        .all()
    )

    return comments