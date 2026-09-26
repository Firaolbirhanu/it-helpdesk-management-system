from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_role,
)
from app.database.database import get_db

from app.models.assignment import TicketAssignment
from app.models.category import TicketCategory
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.models.role import Role

from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
)

from app.services.status_history import record_status_change
from app.services.notifications import add_notification
from app.services.audit import record_audit_event


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


# ============================================================
# CREATE TICKET
# ============================================================

@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = db.get(
        TicketCategory,
        ticket_data.category_id,
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket category not found",
        )

    ticket_number = f"TKT-{uuid4().hex[:8].upper()}"

    new_ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket_data.title,
        description=ticket_data.description,
        requester_id=current_user.id,
        category_id=ticket_data.category_id,
        priority=ticket_data.priority,
    )

    db.add(new_ticket)

    # Generate the ticket ID before creating history
    db.flush()

    # Record initial status
    record_status_change(
        db=db,
        ticket_id=new_ticket.id,
        old_status="NEW",
        new_status=TicketStatus.OPEN.value,
        changed_by=current_user.id,
    )

    add_notification(
        db=db,
        user_id=current_user.id,
        title="Ticket created",
        message=f"Ticket #{new_ticket.ticket_number} has been created successfully.",
        notification_type="ticket_created",
    )

    administrators = (
        db.query(User)
        .join(Role)
        .filter(Role.name == "Administrator", User.id != current_user.id)
        .all()
    )
    for administrator in administrators:
        add_notification(
            db=db,
            user_id=administrator.id,
            title="New ticket created",
            message=f"Ticket #{new_ticket.ticket_number} requires attention.",
            notification_type="ticket_created",
        )

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Ticket",
        entity_id=new_ticket.id,
        new_value=f"Ticket #{new_ticket.ticket_number} created",
    )

    db.commit()
    db.refresh(new_ticket)

    return new_ticket


# ============================================================
# GET MY TICKETS
# ============================================================

@router.get(
    "",
    response_model=list[TicketResponse],
)
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.requester_id == current_user.id
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return tickets
# ============================================================
# GET ALL TICKETS - ADMINISTRATOR
# ============================================================

@router.get(
    "/admin/all",
    response_model=list[TicketResponse],
)
def get_all_tickets(
    current_user: User = Depends(
        require_role("Administrator")
    ),
    db: Session = Depends(get_db),
):
    tickets = (
        db.query(Ticket)
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return tickets
# ============================================================
# GET ALL TECHNICIANS - ADMINISTRATOR
# ============================================================

@router.get(
    "/admin/technicians",
)
def get_all_technicians(
    current_user: User = Depends(
        require_role("Administrator")
    ),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.is_active == True)
        .all()
    )

    technicians = []

    for user in users:
        if user.role.name == "Technician":
            technicians.append(
                {
                    "id": user.id,
                    "email": user.email,
                    "is_active": user.is_active,
                }
            )

    return technicians

# ============================================================
# GET ASSIGNED TICKETS - TECHNICIAN
# IMPORTANT: This must appear before /{ticket_id}
# ============================================================

@router.get(
    "/assigned",
    response_model=list[TicketResponse],
)
def get_assigned_tickets(
    current_user: User = Depends(
        require_role("Technician")
    ),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(TicketAssignment)
        .filter(
            TicketAssignment.technician_id == current_user.id,
            TicketAssignment.unassigned_at.is_(None),
        )
        .all()
    )

    ticket_ids = [
        assignment.ticket_id
        for assignment in assignments
    ]

    if not ticket_ids:
        return []

    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.id.in_(ticket_ids)
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return tickets


# ============================================================
# GET SINGLE TICKET
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.get(
        Ticket,
        ticket_id,
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Employee can only see their own ticket
    if current_user.role.name == "Employee":
        if ticket.requester_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own tickets",
            )

    # Technician can only see tickets assigned to them
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

    return ticket


# ============================================================
# TECHNICIAN STATUS UPDATE
# ASSIGNED → IN_PROGRESS → RESOLVED
# ============================================================

@router.patch(
    "/{ticket_id}/technician-status",
    response_model=TicketResponse,
)
def update_technician_status(
    ticket_id: int,
    status_data: TicketStatusUpdate,
    current_user: User = Depends(
        require_role("Technician")
    ),
    db: Session = Depends(get_db),
):
    ticket = db.get(
        Ticket,
        ticket_id,
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Check that this technician owns the assignment
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

    # Technician can only use these statuses
    allowed_statuses = {
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
    }

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Technicians can only change tickets "
                "to IN_PROGRESS or RESOLVED"
            ),
        )

    # ASSIGNED → IN_PROGRESS
    if (
        status_data.status == TicketStatus.IN_PROGRESS
        and ticket.status != TicketStatus.ASSIGNED
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ticket must be ASSIGNED "
                "before work can begin"
            ),
        )

    # IN_PROGRESS → RESOLVED
    if (
        status_data.status == TicketStatus.RESOLVED
        and ticket.status != TicketStatus.IN_PROGRESS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ticket must be IN_PROGRESS "
                "before it can be resolved"
            ),
        )

    old_status = ticket.status.value

    ticket.status = status_data.status

    # Record history
    record_status_change(
        db=db,
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=status_data.status.value,
        changed_by=current_user.id,
    )

    if status_data.status == TicketStatus.RESOLVED:
        ticket.resolved_at = datetime.utcnow()
        add_notification(
            db=db,
            user_id=ticket.requester_id,
            title="Ticket resolved",
            message=f"Your ticket #{ticket.ticket_number} has been resolved.",
            notification_type="ticket_resolved",
        )

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="STATUS_CHANGE",
        entity_type="Ticket",
        entity_id=ticket.id,
        old_value=old_status,
        new_value=status_data.status.value,
    )

    db.commit()
    db.refresh(ticket)

    return ticket
# ============================================================
# CLOSE TICKET
# RESOLVED → CLOSED
# Employee: own tickets only
# Technician: not allowed
# Administrator: allowed
# ============================================================

@router.patch(
    "/{ticket_id}/close",
    response_model=TicketResponse,
)
def close_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.get(
        Ticket,
        ticket_id,
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    # Employee can close only their own ticket
    if current_user.role.name == "Employee":
        if ticket.requester_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only close your own tickets",
            )

    # Technician cannot close tickets
    elif current_user.role.name == "Technician":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technicians cannot close tickets",
        )

    # Only RESOLVED tickets can be closed
    if ticket.status != TicketStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only RESOLVED tickets can be closed",
        )

    old_status = ticket.status.value

    ticket.status = TicketStatus.CLOSED
    ticket.closed_at = datetime.utcnow()

    record_status_change(
        db=db,
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=TicketStatus.CLOSED.value,
        changed_by=current_user.id,
    )

    add_notification(
        db=db,
        user_id=ticket.requester_id,
        title="Ticket closed",
        message=f"Ticket #{ticket.ticket_number} has been closed.",
        notification_type="ticket_closed",
    )

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="CLOSE",
        entity_type="Ticket",
        entity_id=ticket.id,
        old_value=old_status,
        new_value=TicketStatus.CLOSED.value,
    )

    db.commit()
    db.refresh(ticket)

    return ticket