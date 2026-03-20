from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import User, Product, Purchase
from app.api.v1.deps import get_current_user
from app.schemas.shop import (
    ProductResponse,
    ProductListResponse,
    PurchaseRequest,
    PurchaseResponse,
    PurchaseHistoryItem,
    PurchaseHistoryResponse,
)


router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("", response_model=ProductListResponse)
async def get_products(
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список всех активных товаров в магазине.
    """
    result = await db.execute(
        select(Product)
        .where(Product.is_active == True)
        .order_by(Product.price_points.asc())
    )
    products = result.scalars().all()
    
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products]
    )


@router.get("/purchases/history", response_model=PurchaseHistoryResponse)
async def get_purchase_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить историю покупок текущего пользователя.
    """
    result = await db.execute(
        select(Purchase)
        .where(Purchase.user_id == current_user.id)
        .options(selectinload(Purchase.product))
        .order_by(Purchase.created_at.desc())
    )
    purchases = result.scalars().all()
    
    return PurchaseHistoryResponse(
        purchases=[
            PurchaseHistoryItem(
                id=p.id,
                product_name=p.product.name,
                points_spent=p.points_spent,
                created_at=p.created_at,
            )
            for p in purchases
        ]
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Получить информацию о конкретном товаре.
    """
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )
    
    return ProductResponse.model_validate(product)


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_product(
    request: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обмен баллов на товар.
    
    - Проверяет, что товар существует и активен
    - Проверяет, что товар в наличии (quantity > 0)
    - Проверяет, что у пользователя достаточно баллов
    - Списывает баллы и уменьшает количество товара
    """
    result = await db.execute(
        select(Product).where(Product.id == request.product_id)
    )
    product = result.scalar_one_or_none()
    
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )
    
    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар недоступен для покупки"
        )
    
    if product.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар закончился"
        )
    
    if current_user.balance < product.price_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно баллов. У вас {current_user.balance} баллов, требуется {product.price_points}"
        )
    
    current_user.balance -= product.price_points
    product.quantity -= 1
    
    purchase = Purchase(
        user_id=current_user.id,
        product_id=product.id,
        points_spent=product.price_points,
    )
    db.add(purchase)
    
    await db.flush()
    
    return PurchaseResponse(
        id=purchase.id,
        product_id=product.id,
        product_name=product.name,
        points_spent=purchase.points_spent,
        new_balance=current_user.balance,
        created_at=purchase.created_at,
    )
