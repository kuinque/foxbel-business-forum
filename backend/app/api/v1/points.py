from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import User, Location, QRToken, PointsHistory
from app.schemas.points import ScanQRRequest, ScanQRResponse
from app.api.v1.deps import get_current_user


router = APIRouter(prefix="/points", tags=["points"])


@router.post("/scan", response_model=ScanQRResponse)
async def scan_qr(
    request: ScanQRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Сканирование QR-кода и начисление баллов.
    
    - Проверяет валидность токена
    - Проверяет срок действия токена
    - Проверяет, не получал ли пользователь уже баллы за эту точку
    - Начисляет баллы однократно
    """
    # Ищем токен
    result = await db.execute(
        select(QRToken).where(QRToken.token == request.token)
    )
    qr_token = result.scalar_one_or_none()
    
    if qr_token is None:
        return ScanQRResponse(
            success=False,
            message="QR-код недействителен",
        )
    
    # Проверяем срок действия
    if qr_token.expires_at < datetime.utcnow():
        return ScanQRResponse(
            success=False,
            message="Срок действия QR-кода истёк",
        )
    
    # Загружаем точку
    result = await db.execute(
        select(Location).where(Location.id == qr_token.location_id)
    )
    location = result.scalar_one_or_none()
    
    if location is None or not location.is_active:
        return ScanQRResponse(
            success=False,
            message="Точка не найдена или неактивна",
        )
    
    # Проверяем, не получал ли уже баллы за эту точку
    result = await db.execute(
        select(PointsHistory).where(
            PointsHistory.user_id == current_user.id,
            PointsHistory.location_id == location.id,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing is not None:
        return ScanQRResponse(
            success=False,
            message=f"Вы уже получили баллы за точку «{location.name}»",
        )
    
    # Начисляем баллы
    points_history = PointsHistory(
        user_id=current_user.id,
        location_id=location.id,
        points=location.points_reward,
    )
    db.add(points_history)
    
    # Обновляем баланс пользователя
    current_user.balance += location.points_reward
    
    await db.flush()
    
    return ScanQRResponse(
        success=True,
        message=f"Начислено {location.points_reward} баллов за «{location.name}»!",
        points_earned=location.points_reward,
        new_balance=current_user.balance,
        location_name=location.name,
    )
