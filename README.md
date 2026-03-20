# Foxbel Loyalty System - Telegram Mini App

Система лояльности с QR-кодами для Telegram Mini App.

## Функциональность

- 🎯 **Личный кабинет** — баланс баллов и история начислений
- 📱 **Сканирование QR** — начисление баллов за посещение точек
- 🛍️ **Магазин** — обмен баллов на мерч (футболки, худи, кепки, стикеры и др.)
- 🏆 **Лидерборд** — топ пользователей по баллам
- 🔐 **Авторизация** — через Telegram Mini App (initData)
- 👨‍💼 **Админ-панель** — управление точками и генерация QR-кодов

## Технологии

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL, asyncpg
- **Frontend**: React 18, Vite, Telegram Web App SDK
- **Инфраструктура**: Docker, Docker Compose, Nginx

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

### Авторизация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/auth/telegram` | Авторизация через Telegram initData |

### Профиль
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/me` | Профиль пользователя с балансом и историей |

### Баллы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/points/scan` | Сканирование QR-кода для начисления баллов |

### Магазин
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/shop` | Список активных товаров |
| GET | `/api/v1/shop/{product_id}` | Информация о товаре |
| POST | `/api/v1/shop/purchase` | Покупка товара за баллы |
| GET | `/api/v1/shop/purchases/history` | История покупок пользователя |

### Лидерборд
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/leaderboard` | Топ пользователей по баллам |

### Админ-панель
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/admin/check` | Проверка прав администратора |
| GET | `/api/v1/admin/locations` | Список всех точек |
| POST | `/api/v1/admin/locations` | Создание новой точки |
| POST | `/api/v1/admin/locations/{id}/qr` | Генерация QR-кода для точки |
| GET | `/api/v1/admin/qr/{token}/image` | Получение изображения QR-кода |

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

## Мерч в магазине

| Товар | Баллы | Описание |
|-------|-------|----------|
| Стикерпак | 100 | Набор из 10 виниловых стикеров |
| Блокнот | 150 | Блокнот А5 в твёрдой обложке |
| Носки Foxbel | 200 | Комплект из 3 пар носков |
| Кепка Foxbel | 300 | Бейсболка с вышитым логотипом |
| Термокружка | 400 | Термокружка 350мл с логотипом |
| Футболка Foxbel | 500 | Стильная футболка с логотипом |
| Худи Foxbel | 800 | Тёплое худи с принтом |
| Рюкзак Foxbel | 1000 | Городской рюкзак с отделением для ноутбука |

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

## Добавление администратора

```bash
docker compose exec db psql -U loyalty -d loyalty_db -c \
  "INSERT INTO admins (telegram_id, role) VALUES (<TELEGRAM_ID>, 'admin');"
```
