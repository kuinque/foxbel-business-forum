from datetime import datetime
from pydantic import BaseModel


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price_points: int
    quantity: int
    image_url: str | None
    is_active: bool

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: list[ProductResponse]


class PurchaseRequest(BaseModel):
    product_id: int


class PurchaseResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    points_spent: int
    new_balance: int
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseHistoryItem(BaseModel):
    id: int
    product_name: str
    points_spent: int
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseHistoryResponse(BaseModel):
    purchases: list[PurchaseHistoryItem]
