from datetime import datetime
from pydantic import BaseModel


class PointsHistoryItem(BaseModel):
    id: int
    location_name: str
    points: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    id: int
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    balance: int
    history: list[PointsHistoryItem]

    class Config:
        from_attributes = True
