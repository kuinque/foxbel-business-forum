#!/bin/bash

DOMAIN="foxbel.ru"
EMAIL="krivetskyy@yandex.ru"

# Определяем команду docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Создаём директории
mkdir -p certbot/www certbot/conf

# Сохраняем оригинальный конфиг
cp nginx/nginx.conf nginx/nginx.conf.bak

# Временно используем конфиг только для HTTP (без SSL)
cp nginx/nginx-init.conf nginx/nginx.conf

# Останавливаем nginx если запущен
$DOCKER_COMPOSE stop nginx 2>/dev/null

# Запускаем nginx
$DOCKER_COMPOSE up -d nginx

# Ждём запуска
sleep 3

# Проверяем что nginx отвечает
echo "Checking nginx on port 80..."
curl -s http://$DOMAIN/ || echo "Warning: nginx may not be accessible on port 80"

# Получаем сертификат
docker run --rm \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --preferred-challenges http \
  --keep-until-expiring \
  --non-interactive \
  -d $DOMAIN

# Проверяем успех
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "Certificate obtained successfully!"
    
    # Восстанавливаем полный конфиг с SSL
    mv nginx/nginx.conf.bak nginx/nginx.conf
    
    # Перезапускаем nginx
    $DOCKER_COMPOSE restart nginx
    
    echo "SSL certificate installed for $DOMAIN"
else
    echo "Failed to obtain certificate. Restoring original config..."
    mv nginx/nginx.conf.bak nginx/nginx.conf
    exit 1
fi
