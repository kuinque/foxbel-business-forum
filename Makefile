.PHONY: help up down build logs shell migrate test

help:
	@echo "Доступные команды:"
	@echo "  make up        - Запустить все сервисы"
	@echo "  make down      - Остановить все сервисы"
	@echo "  make build     - Пересобрать контейнеры"
	@echo "  make logs      - Показать логи API"
	@echo "  make shell     - Войти в контейнер API"
	@echo "  make migrate   - Применить миграции"
	@echo "  make test      - Запустить тесты"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f api

shell:
	docker compose exec api bash

migrate:
	docker compose exec api alembic upgrade head

test:
	docker compose exec api pytest
