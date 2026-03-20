from datetime import datetime
from pydantic import BaseModel


class LocationCreate(BaseModel):
    name: str
    description: str | None = None
    points_reward: int = 10


class LocationResponse(BaseModel):
    id: int
    name: str
    description: str | None
    points_reward: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QRTokenResponse(BaseModel):
    id: int
    location_id: int
    token: str
    expires_at: datetime
    qr_code_url: str

    class Config:
        from_attributes = True


class GenerateQRRequest(BaseModel):
    ttl_hours: int | None = None
