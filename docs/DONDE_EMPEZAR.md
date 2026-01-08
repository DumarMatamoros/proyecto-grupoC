# 🚀 Tutorial Rápido - API en 10 Minutos

## Paso 1: Iniciar Servidor

```bash
cd backend
php artisan serve
```

Debería ver: `Laravel development server started: http://127.0.0.1:8000`

---

## Paso 2: Login (obtener token)

**En Postman o cURL:**

```
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Respuesta:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

👉 **Copiar el token** para los próximos requests

---

## Paso 3: Crear Factura (Consumidor Final)

```
POST http://localhost:8000/api/facturas
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "cedula_cliente": "9999999999",
  "nombre_cliente": "CONSUMIDOR FINAL",
  "sucursal_id": 1,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 1,
      "precio_unitario": 150
    }
  ]
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "data": {
    "factura_id": 1,
    "numero_factura": "001-001-000001",
    "subtotal": 150,
    "impuesto": 18,
    "total": 168
  }
}
```

---

## Paso 4: Verificar en Base de Datos

```bash
psql -U postgres -d proyecto_facturacion
```

```sql
SELECT * FROM facturas WHERE cedula_cliente = '9999999999';
```

**Esperado:** Factura visible en BD con datos correctos

---

## ✅ Listo!

**Los 4 pasos básicos:**
1. ✅ Servidor corriendo
2. ✅ Token obtenido
3. ✅ Factura creada
4. ✅ Datos verificados en BD

---

## 📎 Guías recomendadas

- Instalación desde cero y arranque: [docs/EJECUTAR_PROYECTO.md](EJECUTAR_PROYECTO.md)
- Dockerizar y levantar todo con contenedores: [docs/DOCKER.md](DOCKER.md)
- Ejemplos de endpoints en Postman: [docs/EJEMPLOS_POSTMAN.md](EJEMPLOS_POSTMAN.md)

---

## 🔧 Si Algo Falla

| Error | Solución |
|-------|----------|
| "Connection refused" | `php artisan serve` |
| "Unauthenticated" | Copiar token nuevamente |
| "Validation error" | Verificar formato JSON |
| Datos no guardan | Reiniciar: `php artisan migrate:refresh --seed` |

---

## 📚 Más Ejemplos

### Cambiar IVA a 18%
```
PUT http://localhost:8000/api/admin/configuraciones-iva
Authorization: Bearer {token}
{
  "porcentaje": 18
}
```

### Listar Facturas
```
GET http://localhost:8000/api/facturas
Authorization: Bearer {token}
```

### Ver IVA Actual (sin token)
```
GET http://localhost:8000/api/config/iva
```

---

**¡Hecho!** Ahora prueba los otros 20 endpoints de la misma forma.
