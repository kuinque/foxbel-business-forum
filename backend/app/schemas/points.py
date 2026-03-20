from pydantic import BaseModel


class ScanQRRequest(BaseModel):
    token: str


class ScanQRResponse(BaseModel):
    success: bool
    message: str
    points_earned: int | None = None
    new_balance: int | None = None
    location_name: str | None = None
