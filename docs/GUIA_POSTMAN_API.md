# Guía de Prueba de API - Postman/Insomnia

## Credenciales de Prueba

**Admin:**
- Email: `admin@example.com`
- Password: `password`

## Rutas Públicas (Sin Autenticación)

### 1. REGISTRO DE NUEVO USUARIO

**POST** `/api/auth/register`

**Body (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password",
  "password_confirmation": "password",
  "tipo": "cliente"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "usuario_id": 23,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "tipo": "cliente",
      "email_verified_at": null,
      "created_at": "2025-11-13T16:57:00.000000Z",
      "updated_at": "2025-11-13T16:57:00.000000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

---

### 2. LOGIN

**POST** `/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión iniciada exitosamente",
  "data": {
    "usuario": {
      "usuario_id": 1,
      "nombre": "Admin Principal",
      "email": "admin@example.com",
      "tipo": "administrador",
      "email_verified_at": null,
      "created_at": "2025-11-13T16:56:25.000000Z",
      "updated_at": "2025-11-13T16:56:25.000000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

---

## Rutas Protegidas (Requieren Token)

**Añadir a Headers:**
```
Authorization: Bearer {token_aqui}
```

### 3. OBTENER USUARIO ACTUAL

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "nombre": "Admin Principal",
    "email": "admin@example.com",
    "tipo": "administrador",
    "email_verified_at": null,
    "created_at": "2025-11-13T16:56:25.000000Z",
    "updated_at": "2025-11-13T16:56:25.000000Z"
  }
}
```

---

### 4. ACTUALIZAR PERFIL

**PUT** `/api/auth/perfil`

**Headers:**
```
Authorization: Bearer {token}
```

**Body (JSON):**
```json
{
  "nombre": "Admin Actualizado",
  "email": "admin.nuevo@example.com",
  "password": "nuevopassword",
  "password_confirmation": "nuevopassword"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "usuario_id": 1,
    "nombre": "Admin Actualizado",
    "email": "admin.nuevo@example.com",
    "tipo": "administrador",
    "updated_at": "2025-11-13T16:57:30.000000Z"
  }
}
```

---

### 5. CERRAR SESIÓN

**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## Rutas de Administrador (Requieren Token + Rol Admin)

### 6. OBTENER DASHBOARD

**GET** `/api/admin/dashboard`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "total_usuarios": 23,
    "total_empleados": 5,
    "total_clientes": 8,
    "total_proveedores": 5,
    "total_administradores": 3,
    "usuarios_por_tipo": {
      "empleados": 5,
      "clientes": 8,
      "proveedores": 5,
      "administradores": 3
    }
  }
}
```

---

### 7. LISTAR TODOS LOS USUARIOS

**GET** `/api/admin/usuarios?tipo=cliente&page=1&per_page=15`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `tipo` (opcional): `empleado`, `cliente`, `proveedor`, `administrador`
- `page` (opcional): número de página (default: 1)
- `per_page` (opcional): items por página (default: 15)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "usuario_id": 10,
        "nombre": "Cliente 1",
        "email": "cliente1@example.com",
        "tipo": "cliente",
        "email_verified_at": null,
        "created_at": "2025-11-13T16:56:26.000000Z",
        "updated_at": "2025-11-13T16:56:26.000000Z"
      }
    ],
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "to": 8,
    "total": 8
  }
}
```

---

### 8. VER DETALLES DE UN USUARIO

**GET** `/api/admin/usuarios/10`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 10,
    "nombre": "Cliente 1",
    "email": "cliente1@example.com",
    "tipo": "cliente",
    "email_verified_at": null,
    "created_at": "2025-11-13T16:56:26.000000Z",
    "updated_at": "2025-11-13T16:56:26.000000Z",
    "cliente": {
      "cliente_id": 3,
      "usuario_id": 10,
      "ruc_cedula": "12345678910",
      "razon_social": "Tech Solutions Inc",
      "direccion": "123 Oak St",
      "telefono": "555-1234",
      "tipo": "juridica",
      "created_at": "2025-11-13T16:56:26.000000Z",
      "updated_at": "2025-11-13T16:56:26.000000Z"
    }
  }
}
```

---

### 9. ACTUALIZAR UN USUARIO

**PUT** `/api/admin/usuarios/10`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Body (JSON):**
```json
{
  "nombre": "Cliente Actualizado",
  "email": "cliente.nuevo@example.com",
  "tipo": "cliente"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "usuario_id": 10,
    "nombre": "Cliente Actualizado",
    "email": "cliente.nuevo@example.com",
    "tipo": "cliente",
    "updated_at": "2025-11-13T16:58:00.000000Z"
  }
}
```

---

### 10. ELIMINAR UN USUARIO

**DELETE** `/api/admin/usuarios/10`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

### 11. OBTENER INFORMACIÓN DEL ADMINISTRADOR

**GET** `/api/admin/info`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "nombre": "Admin Principal",
    "email": "admin@example.com",
    "tipo": "administrador",
    "created_at": "2025-11-13T16:56:25.000000Z",
    "updated_at": "2025-11-13T16:56:25.000000Z",
    "administrador": {
      "administrador_id": 1,
      "usuario_id": 1,
      "nivel": "super",
      "permisos": "{\"usuarios\":true,\"empleados\":true,\"clientes\":true,\"proveedores\":true}",
      "created_at": "2025-11-13T16:56:25.000000Z",
      "updated_at": "2025-11-13T16:56:25.000000Z"
    }
  }
}
```

---

## Códigos de Error

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error en los datos enviados |
| 401 | Unauthorized - Credenciales incorrectas |
| 403 | Forbidden - No tienes permisos para acceder |
| 404 | Not Found - El recurso no existe |
| 422 | Unprocessable Entity - Errores de validación |
| 500 | Internal Server Error - Error del servidor |

---

## Notas Importantes

1. **Token**: Guarda el token retornado en el login y úsalo en los headers de todas las peticiones protegidas.
2. **Tipo de Contenido**: Asegúrate de añadir el header `Content-Type: application/json` en Postman.
3. **Base URL**: Todas las rutas son relativas a `http://localhost:8000` (ajusta según tu configuración).
4. **Permisos**: Solo los usuarios con `tipo='administrador'` pueden acceder a las rutas `/api/admin/*`.
