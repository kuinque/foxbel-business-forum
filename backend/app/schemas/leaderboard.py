from pydantic import BaseModel


class LeaderboardItem(BaseModel):
    rank: int
    username: str | None
    first_name: str | None
    balance: int
    is_current_user: bool = False

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    leaders: list[LeaderboardItem]
    current_user_rank: int | None = None
    total_users: int
