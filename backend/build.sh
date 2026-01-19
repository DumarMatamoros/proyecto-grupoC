#!/bin/bash

# Instalar dependencias
composer install --no-dev --optimize-autoloader

# Generar key si no existe
php artisan key:generate --force

# Cachear configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force

# Ejecutar seeders (opcional, descomenta si necesitas datos iniciales)
# php artisan db:seed --force

# Crear enlace simbólico para storage
php artisan storage:link
