from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketAssignmentCreate(BaseModel):
    technician_id: int = Field(..., gt=0)


class TicketAssignmentResponse(BaseModel):
    id: int
    ticket_id: int
    technician_id: int
    assigned_by: int
    assigned_at: datetime
    unassigned_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )