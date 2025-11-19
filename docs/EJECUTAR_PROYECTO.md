# 🚀 Cómo Ejecutar el Proyecto

## ✅ Base de Datos Preparada

La base de datos ha sido limpiada y levantada exitosamente con:
- ✅ Todas las tablas creadas
- ✅ Datos iniciales cargados (seeders)
- ✅ Usuario admin creado: `admin@example.com` / `password`

---

## 1️⃣ Iniciar el Backend (Laravel)

En una terminal, en la carpeta `backend`:

```bash
cd backend
php artisan serve
```

Verás:
```
Laravel development server started: http://127.0.0.1:8000
```

---

## 2️⃣ Iniciar el Frontend (React + Vite)

En otra terminal, en la carpeta `frontend`:

```bash
cd frontend
npm run dev
```

Verás:
```
➜  Local:   http://localhost:5173/
```

---

## 3️⃣ Acceder a la Aplicación

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:8000/api

---

## 🔑 Credenciales de Prueba

| Usuario | Email | Contraseña |
|---------|-------|-----------|
| Admin | admin@example.com | password |

---

## 📝 Pruebas Rápidas

### Login en Postman
```
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

### Obtener Lista de Usuarios
```
GET http://localhost:8000/api/usuarios
Authorization: Bearer {tu_token}
```

---

## 🗄️ Limpiar y Recrear BD (si es necesario)

```bash
cd backend
php artisan migrate:fresh --seed
```

---

## 🆘 Comandos Útiles

```bash
# Ver logs en tiempo real
php artisan logs

# Ejecutar tests
php artisan test

# Optimizar cache
php artisan optimize:clear
php artisan cache:clear
```

¡Listo! El proyecto está preparado para ejecutar. 🎉
