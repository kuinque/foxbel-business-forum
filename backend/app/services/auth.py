from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from app.core.config import settings


class TokenError(Exception):
    pass


def create_access_token(user_id: int) -> str:
    """Создаёт JWT токен для пользователя."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expires_hours)
    
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    """
    Декодирует JWT токен и возвращает user_id.
    
    Raises:
        TokenError: если токен невалиден или истёк
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise TokenError("Invalid token payload")
        return int(user_id)
    except JWTError as e:
        raise TokenError(f"Invalid token: {e}")
