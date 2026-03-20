import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import User, Admin, Location, QRToken
from app.schemas.admin import (
    LocationCreate,
    LocationResponse,
    QRTokenResponse,
    GenerateQRRequest,
)
from app.api.v1.deps import get_current_user


router = APIRouter(prefix="/admin", tags=["admin"])


async def get_admin_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Проверяет, что пользователь является администратором."""
    result = await db.execute(
        select(Admin).where(Admin.telegram_id == current_user.telegram_id)
    )
    admin = result.scalar_one_or_none()
    
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права администратора.",
        )
    
    return current_user


@router.get("/locations", response_model=list[LocationResponse])
async def list_locations(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Список всех точек."""
    result = await db.execute(
        select(Location).order_by(Location.created_at.desc())
    )
    return result.scalars().all()


@router.post("/locations", response_model=LocationResponse)
async def create_location(
    data: LocationCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Создать новую точку."""
    location = Location(
        name=data.name,
        description=data.description,
        points_reward=data.points_reward,
    )
    db.add(location)
    await db.flush()
    await db.refresh(location)
    return location


@router.post("/locations/{location_id}/qr", response_model=QRTokenResponse)
async def generate_qr(
    location_id: int,
    data: GenerateQRRequest = GenerateQRRequest(),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Сгенерировать новый QR-код для точки."""
    # Проверяем существование точки
    result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    location = result.scalar_one_or_none()
    
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Точка не найдена",
        )
    
    # Генерируем токен
    token = secrets.token_urlsafe(32)
    ttl_hours = data.ttl_hours or settings.qr_token_ttl_hours
    expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
    
    # Деактивируем старые токены для этой точки (опционально)
    # await db.execute(
    #     delete(QRToken).where(QRToken.location_id == location_id)
    # )
    
    qr_token = QRToken(
        location_id=location_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(qr_token)
    await db.flush()
    await db.refresh(qr_token)
    
    return QRTokenResponse(
        id=qr_token.id,
        location_id=qr_token.location_id,
        token=qr_token.token,
        expires_at=qr_token.expires_at,
        qr_code_url=f"/api/v1/admin/qr/{qr_token.token}/image",
    )


@router.get("/qr/{token}/image")
async def get_qr_image(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Получить QR-код как изображение."""
    import qrcode
    import io
    from fastapi.responses import StreamingResponse
    
    # Проверяем существование токена
    result = await db.execute(
        select(QRToken).where(QRToken.token == token)
    )
    qr_token = result.scalar_one_or_none()
    
    if qr_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR-код не найден",
        )
    
    # Генерируем QR-код
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Сохраняем в буфер
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")


@router.get("/check")
async def check_admin(
    admin: User = Depends(get_admin_user),
):
    """Проверить, является ли пользователь администратором."""
    return {"is_admin": True}
