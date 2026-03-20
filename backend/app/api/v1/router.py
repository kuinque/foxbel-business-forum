from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.points import router as points_router
from app.api.v1.admin import router as admin_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.shop import router as shop_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(points_router)
api_router.include_router(admin_router)
api_router.include_router(leaderboard_router)
api_router.include_router(shop_router)


@api_router.get("/")
async def root():
    return {"message": "Loyalty System API v1"}
