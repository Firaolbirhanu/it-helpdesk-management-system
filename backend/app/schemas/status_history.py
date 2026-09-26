from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StatusHistoryResponse(BaseModel):
    id: int
    ticket_id: int
    old_status: str
    new_status: str
    changed_by: int
    changed_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )