from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import User
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardItem
from app.api.v1.deps import get_current_user


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить таблицу лидеров.
    Возвращает топ пользователей по балансу и позицию текущего пользователя.
    """
    # Получаем топ пользователей
    result = await db.execute(
        select(User)
        .where(User.balance > 0)
        .order_by(desc(User.balance))
        .limit(limit)
    )
    top_users = result.scalars().all()
    
    # Формируем список лидеров
    leaders = []
    for rank, user in enumerate(top_users, start=1):
        leaders.append(
            LeaderboardItem(
                rank=rank,
                username=user.username,
                first_name=user.first_name,
                balance=user.balance,
                is_current_user=(user.id == current_user.id),
            )
        )
    
    # Считаем общее количество пользователей с баллами
    total_result = await db.execute(
        select(func.count(User.id)).where(User.balance > 0)
    )
    total_users = total_result.scalar() or 0
    
    # Находим позицию текущего пользователя
    current_user_rank = None
    if current_user.balance > 0:
        rank_result = await db.execute(
            select(func.count(User.id))
            .where(User.balance > current_user.balance)
        )
        users_above = rank_result.scalar() or 0
        current_user_rank = users_above + 1
    
    return LeaderboardResponse(
        leaders=leaders,
        current_user_rank=current_user_rank,
        total_users=total_users,
    )
