from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_role
from app.database.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


def serialize_audit_log(audit_log: AuditLog) -> dict:
    actor = audit_log.user
    return {
        "id": audit_log.id,
        "user_id": audit_log.user_id,
        "actor_name": (
            f"{actor.first_name} {actor.last_name}"
            if actor
            else "System"
        ),
        "actor_role": actor.role.name if actor and actor.role else None,
        "action": audit_log.action,
        "entity_type": audit_log.entity_type,
        "entity_id": audit_log.entity_id,
        "old_value": audit_log.old_value,
        "new_value": audit_log.new_value,
        "created_at": audit_log.created_at,
    }


@router.get("")
def get_audit_logs(
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    audit_logs = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user).joinedload(User.role))
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    return [serialize_audit_log(audit_log) for audit_log in audit_logs]


@router.get("/tickets/{ticket_id}")
def get_ticket_audit_logs(
    ticket_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    audit_logs = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user).joinedload(User.role))
        .filter(
            AuditLog.entity_type == "Ticket",
            AuditLog.entity_id == ticket_id,
        )
        .order_by(AuditLog.created_at.asc())
        .all()
    )
    return [serialize_audit_log(audit_log) for audit_log in audit_logs]