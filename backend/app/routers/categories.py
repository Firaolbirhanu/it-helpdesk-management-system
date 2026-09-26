from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.category import TicketCategory
from app.models.user import User


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"],
)


@router.get("")
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(TicketCategory)
        .filter(TicketCategory.is_active.is_(True))
        .order_by(TicketCategory.name)
        .all()
    )
