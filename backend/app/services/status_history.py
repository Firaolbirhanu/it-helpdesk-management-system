from sqlalchemy.orm import Session

from app.models.status_history import TicketStatusHistory


def record_status_change(
    db: Session,
    ticket_id: int,
    old_status: str,
    new_status: str,
    changed_by: int,
):
    history = TicketStatusHistory(
        ticket_id=ticket_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
    )

    db.add(history)

    return history