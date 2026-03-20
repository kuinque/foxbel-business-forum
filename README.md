# Loyalty System - Telegram Mini App

Система лояльности с QR-кодами для Telegram Mini App.

## Функциональность

- 🎯 **Личный кабинет** — баланс баллов и история начислений
- 📱 **Сканирование QR** — начисление баллов за посещение точек
- 🛍️ **Магазин** — обмен баллов на товары
- 🔐 **Авторизация** — через Telegram Mini App (initData)
- 👨‍💼 **Админ-панель** — управление точками, QR-кодами и товарами

## Технологии

- **Backend**: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis
- **Frontend**: React (Telegram Mini App)
- **Инфраструктура**: Docker, Docker Compose

## Быстрый старт

### 1. Клонирование и настройка

```bash
# Копируем конфигурацию
cp .env.example .env

# Редактируем .env — указываем TELEGRAM_BOT_TOKEN и JWT_SECRET
nano .env
```

### 2. Запуск через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f api
```

### 3. Применение миграций

```bash
# Войти в контейнер API
docker-compose exec api bash

# Применить миграции
alembic upgrade head
```

### 4. Проверка

- API Health: http://localhost:8000/health
- API Docs (debug mode): http://localhost:8000/docs

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, DB, Redis
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # Telegram Mini App (React)
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/auth/telegram` | Авторизация через Telegram |
| GET | `/api/v1/me` | Профиль и баланс |
| GET | `/api/v1/me/history` | История начислений |
| POST | `/api/v1/points/scan` | Сканирование QR-кода |
| GET | `/api/v1/shop/products` | Список товаров |
| POST | `/api/v1/shop/purchase` | Покупка товара |
| POST | `/api/v1/admin/locations` | Создание точки |
| POST | `/api/v1/admin/locations/{id}/qr` | Генерация QR |

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `POSTGRES_USER` | Пользователь PostgreSQL | loyalty |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL | loyalty_secret |
| `POSTGRES_DB` | Имя базы данных | loyalty_db |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | — |
| `JWT_SECRET` | Секрет для JWT | — |
| `JWT_EXPIRES_HOURS` | Время жизни JWT (часы) | 168 |
| `QR_TOKEN_TTL_HOURS` | TTL QR-токена (часы) | 24 |
| `DEBUG` | Режим отладки | false |

## Разработка

### Локальный запуск без Docker

```bash
cd backend

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements.txt

# Запуск
uvicorn app.main:app --reload
```

## Лицензия

MIT
