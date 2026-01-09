# 🐳 Dockerización desde cero

Guía corta para levantar todo con Docker sin instalar PHP ni Node en tu máquina.

## 1) Requisitos previos
- Docker Desktop instalado y corriendo.
- Puertos libres: 5432 (Postgres), 8000 (API), 5173 (frontend).

## 2) Qué contienen los servicios
- `db` → Postgres 15 con DB `DBgrupoC`, usuario `postgres` / `postgres`.
- `backend` → Laravel sobre php:8.4-apache. Expone 80 → host 8000.
- `frontend` → Vite/React. Expone 5173.

## 2.1) docker-compose usado
Archivo completo: [docker-compose.yml](../docker-compose.yml)

```yaml
services:
	frontend:
		build: ./frontend
		ports:
			- "5173:5173"
		volumes:
			- ./frontend:/app
			- /app/node_modules
		command: npm run dev -- --host
		depends_on:
			- backend

	backend:
		build: ./backend
		ports:
			- "8000:80"
		depends_on:
			- db

	db:
		image: postgres:15
		environment:
			POSTGRES_DB: DBgrupoC
			POSTGRES_USER: postgres
			POSTGRES_PASSWORD: postgres
		ports:
			- "5432:5432"
```

Notas:
- Los puertos expuestos en host son 5173 (frontend), 8000 (API) y 5432 (Postgres).
- Los volúmenes del frontend montan el código local y preservan `node_modules` dentro del contenedor.
- Las credenciales de DB se referencian en `backend/.env` (sección 3).

## 3) Preparar variables de entorno
En `backend/.env` usa las credenciales del servicio `db`:
```
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=DBgrupoC
DB_USERNAME=postgres
DB_PASSWORD=postgres
```
(Ya quedan listas en este repo; ajusta solo si cambias credenciales.)

## 4) Construir y levantar
Desde la raíz del proyecto:
```powershell
docker compose up -d --build
```
Esto crea las imágenes y levanta los 3 contenedores.

Verifica que estén arriba:
```powershell
docker compose ps
```

## 5) Migraciones y seeders (primer arranque)
Corre dentro del contenedor backend:
```powershell
docker compose exec backend php artisan migrate --seed
```
Esto crea tablas y datos de prueba (roles, permisos, admin, catálogos, etc.).

## 6) URLs de uso
- API: http://localhost:8000
- Frontend: http://localhost:5173

## 7) Comandos útiles
- Logs backend: `docker compose logs -f backend`
- Logs db: `docker compose logs -f db`
- Reiniciar backend: `docker compose restart backend`
- Limpiar caché de Laravel: `docker compose exec backend php artisan config:clear`
- Reconstruir todo: `docker compose up -d --build`

## 8) Problemas frecuentes
- **DB_HOST en 127.0.0.1** → debe ser `db` dentro de Docker.
- **Configuración cacheada** → `docker compose exec backend php artisan config:clear` y reinicia.
- **Credenciales cambiadas** → actualiza `backend/.env` y recrea contenedores (`docker compose up -d --build`).

Listo: con estos pasos el stack queda levantado solo con Docker.

## 9) Dockerfiles usados

- Backend: [backend/Dockerfile](../backend/Dockerfile) (php:8.4-apache)

```dockerfile
# Habilita extensiones necesarias para Postgres
RUN apt-get update && apt-get install -y \
	libpq-dev zip unzip git curl \
	&& docker-php-ext-install pdo pdo_pgsql \
	&& apt-get clean && rm -rf /var/lib/apt/lists/*

# Habilita rewrite y apunta DocumentRoot a /public
RUN a2enmod rewrite
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
COPY . .
# Ajusta permisos para www-data
RUN chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html

EXPOSE 80
```

- Frontend: [frontend/Dockerfile](../frontend/Dockerfile) (node:20-alpine)

```dockerfile
WORKDIR /app
COPY package*.json ./
RUN npm install

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```
