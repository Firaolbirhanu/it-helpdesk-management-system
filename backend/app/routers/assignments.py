from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.database import get_db

from app.models.assignment import TicketAssignment
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User

from app.schemas.assignment import (
    TicketAssignmentCreate,
    TicketAssignmentResponse,
)

from app.services.status_history import record_status_change
from app.services.notifications import add_notification
from app.services.audit import record_audit_event


router = APIRouter(
    prefix="/api/tickets",
    tags=["Ticket Assignments"],
)


@router.post(
    "/{ticket_id}/assign",
    response_model=TicketAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_ticket(
    ticket_id: int,
    assignment_data: TicketAssignmentCreate,
    current_user: User = Depends(
        require_role("Administrator")
    ),
    db: Session = Depends(get_db),
):
    # ========================================================
    # 1. Find the ticket
    # ========================================================

    ticket = db.get(
        Ticket,
        ticket_id,
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # ========================================================
    # 2. Make sure ticket can be assigned
    # ========================================================

    if ticket.status != TicketStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only OPEN tickets can be assigned",
        )

    # ========================================================
    # 3. Find the technician
    # ========================================================

    technician = db.get(
        User,
        assignment_data.technician_id,
    )

    if technician is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found",
        )

    # ========================================================
    # 4. Make sure selected user is a Technician
    # ========================================================

    if technician.role.name != "Technician":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a technician",
        )

    # ========================================================
    # 5. Make sure technician is active
    # ========================================================

    if not technician.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Technician account is inactive",
        )

    # ========================================================
    # 6. Check existing active assignment
    # ========================================================

    existing_assignment = (
        db.query(TicketAssignment)
        .filter(
            TicketAssignment.ticket_id == ticket_id,
            TicketAssignment.unassigned_at.is_(None),
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already assigned to a technician",
        )

    # ========================================================
    # 7. Create assignment
    # ========================================================

    new_assignment = TicketAssignment(
        ticket_id=ticket_id,
        technician_id=technician.id,
        assigned_by=current_user.id,
    )

    db.add(new_assignment)

    # ========================================================
    # 8. Change ticket status
    # ========================================================

    old_status = ticket.status.value

    ticket.status = TicketStatus.ASSIGNED

    # ========================================================
    # 9. Record status history
    # ========================================================

    record_status_change(
        db=db,
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=TicketStatus.ASSIGNED.value,
        changed_by=current_user.id,
    )

    add_notification(
        db=db,
        user_id=technician.id,
        title="Ticket assigned to you",
        message=f"Ticket #{ticket.ticket_number} was assigned to you.",
        notification_type="ticket_assigned",
    )

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="ASSIGN",
        entity_type="Ticket",
        entity_id=ticket.id,
        old_value="Unassigned",
        new_value=f"Technician #{technician.id} ({technician.first_name} {technician.last_name})",
    )
    add_notification(
        db=db,
        user_id=ticket.requester_id,
        title="Ticket assigned",
        message=f"Ticket #{ticket.ticket_number} has been assigned to a technician.",
        notification_type="ticket_assigned",
    )

    # ========================================================
    # 10. Save everything
    # ========================================================

    db.commit()

    db.refresh(new_assignment)

    return new_assignment