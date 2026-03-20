from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import User
from app.schemas.auth import TelegramAuthRequest, AuthResponse, UserResponse
from app.services.telegram import verify_init_data, TelegramAuthError
from app.services.auth import create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthResponse)
async def auth_telegram(
    request: TelegramAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Авторизация через Telegram Mini App.
    
    Принимает initData из Telegram WebApp, проверяет подпись,
    создаёт или обновляет пользователя, возвращает JWT токен.
    """
    # Проверяем подпись Telegram
    try:
        tg_user = verify_init_data(request.init_data)
    except TelegramAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    
    telegram_id = tg_user.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram ID not found in user data",
        )
    
    # Ищем или создаём пользователя
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        # Создаём нового пользователя
        user = User(
            telegram_id=telegram_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            last_name=tg_user.get("last_name"),
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        # Обновляем данные существующего пользователя
        user.username = tg_user.get("username")
        user.first_name = tg_user.get("first_name")
        user.last_name = tg_user.get("last_name")
        await db.flush()
    
    # Создаём JWT токен
    access_token = create_access_token(user.id)
    
    return AuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )
