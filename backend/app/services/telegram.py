import hmac
import hashlib
import json
import time
from urllib.parse import parse_qsl

from app.core.config import settings


class TelegramAuthError(Exception):
    pass


def verify_init_data(init_data: str) -> dict:
    """
    Проверяет подпись Telegram initData и возвращает данные пользователя.
    
    Raises:
        TelegramAuthError: если подпись невалидна или данные устарели
    """
    if not init_data:
        raise TelegramAuthError("initData is empty")
    
    try:
        parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    except Exception:
        raise TelegramAuthError("Failed to parse initData")
    
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise TelegramAuthError("Hash not found in initData")
    
    # Собираем строку для проверки (сортировка по ключам)
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )
    
    # Создаём секретный ключ: HMAC-SHA256("WebAppData", bot_token)
    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram_bot_token.encode(),
        hashlib.sha256
    ).digest()
    
    # Вычисляем хеш данных
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Сравниваем хеши (constant-time comparison)
    if not hmac.compare_digest(calculated_hash, received_hash):
        raise TelegramAuthError("Invalid signature")
    
    # Проверяем auth_date (не старше 24 часов)
    auth_date = int(parsed.get("auth_date", 0))
    if time.time() - auth_date > 86400:
        raise TelegramAuthError("Auth data expired")
    
    # Парсим данные пользователя
    user_data = parsed.get("user")
    if not user_data:
        raise TelegramAuthError("User data not found")
    
    try:
        return json.loads(user_data)
    except json.JSONDecodeError:
        raise TelegramAuthError("Invalid user data format")
