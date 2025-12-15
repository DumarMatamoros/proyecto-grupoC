# 🚀 Guía completa: ejecutar proyecto desde cero (Windows)

## 2️ Backend (Laravel)

### 2.1 Instalar dependencias
```powershell
cd backend
composer install
npm install
```

### 2.2 Crear y configurar `.env`
Copia el ejemplo si existe y ajusta:
```powershell
copy .env.example .env
```
Edita `backend/.env` con PostgreSQL:
```
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=db_facturacion
DB_USERNAME=admin
DB_PASSWORD=admin

VITE_API_URL=http://localhost:8000
```

### 2.3 Generar clave de aplicación
```powershell
php artisan key:generate
```

### 2.4 Habilitar extensiones PHP (si fuera necesario)
Si al migrar aparece `Call to undefined function mb_split()`, habilita `mbstring` y verifica PostgreSQL:
```powershell
php --ini
# Edita php.ini y asegúrate de tener:
# extension=mbstring
# extension=pgsql
# extension=pdo_pgsql
php -m
```

### 2.5 Migrar y seedear la base de datos
```powershell
php artisan migrate --seed
```

### 2.6 Levantar servidor de desarrollo
```powershell
php artisan serve --host=127.0.0.1 --port=8000
```
Back disponible en: http://127.0.0.1:8000

---

## 3️⃣ Frontend (React + Vite)

### 3.1 Instalar dependencias
```powershell
cd ..\frontend
npm install
```

### 3.2 Configurar `.env` del frontend
Edita `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

### 3.3 Levantar Vite
```powershell
npm run dev
```
Frontend disponible en: http://localhost:5173/

---

## 4️⃣ Probar la aplicación

- Frontend: http://localhost:5173/
- API base: http://localhost:8000
- Endpoints API típicos: ver [docs/EJEMPLOS_POSTMAN.md](../docs/EJEMPLOS_POSTMAN.md)

---

## 🔑 Credenciales de prueba

- Admin: `admin@example.com` / `password` (ver seeders si aplica)

---

## 🛠️ Troubleshooting

- Error `mb_split`: habilita `extension=mbstring` en `php.ini` y reinicia CLI.
- Conexión PostgreSQL: verifica servicio activo y credenciales en `backend/.env`.
- CORS: si el frontend no accede a la API, revisa `config/cors.php` en Laravel.

---

## 🗄️ Limpiar y recrear BD
```powershell
cd backend
php artisan migrate:fresh --seed
```

---

## 🧪 Comandos útiles
```powershell
# Ejecutar tests
php artisan test

# Limpiar caches
php artisan optimize:clear
php artisan cache:clear
```

¡Listo! Con esto puedes levantar el proyecto desde cero. 🎉
