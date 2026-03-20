from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import User, PointsHistory, Location
from app.schemas.user import ProfileResponse, PointsHistoryItem
from app.api.v1.deps import get_current_user


router = APIRouter(tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Личный кабинет: баланс и история начислений.
    """
    # Загружаем историю начислений с названиями точек
    result = await db.execute(
        select(PointsHistory, Location.name)
        .join(Location, PointsHistory.location_id == Location.id)
        .where(PointsHistory.user_id == current_user.id)
        .order_by(PointsHistory.created_at.desc())
    )
    
    history_items = []
    for points_record, location_name in result.all():
        history_items.append(
            PointsHistoryItem(
                id=points_record.id,
                location_name=location_name,
                points=points_record.points,
                created_at=points_record.created_at,
            )
        )
    
    return ProfileResponse(
        id=current_user.id,
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        balance=current_user.balance,
        history=history_items,
    )
