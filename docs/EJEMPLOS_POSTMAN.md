# 📊 Postman - Colección de Ejemplos

Copiar y pegar cada sección en Postman como requests separados.

---

## 🔐 AUTENTICACIÓN

### Login
```
POST http://localhost:8000/api/auth/login

{
  "email": "admin@example.com",
  "password": "password"
}
```
📌 **Guardar el token en variable** `token` de Postman

### Ver Mi Perfil
```
GET http://localhost:8000/api/auth/me
Authorization: Bearer {{token}}
```

---

## 📄 FACTURACIÓN

### Crear Factura - Cliente
```
POST http://localhost:8000/api/facturas
Authorization: Bearer {{token}}

{
  "cliente_id": 1,
  "cedula_cliente": "1010334256",
  "nombre_cliente": "Tienda ABC",
  "sucursal_id": 1,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 100
    }
  ]
}
```

### Crear Factura - Consumidor Final ⭐
```
POST http://localhost:8000/api/facturas
Authorization: Bearer {{token}}

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

### Listar Facturas
```
GET http://localhost:8000/api/facturas
Authorization: Bearer {{token}}
```

### Ver Factura (ID=1)
```
GET http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}
```

### Actualizar Factura
```
PUT http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}

{
  "estado": "emitida"
}
```

### Eliminar Factura
```
DELETE http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}
```

---

## 👨‍💼 ADMIN

### Dashboard
```
GET http://localhost:8000/api/admin/dashboard
Authorization: Bearer {{token}}
```

### Listar Usuarios
```
GET http://localhost:8000/api/admin/usuarios
Authorization: Bearer {{token}}
```

### Ver Usuario (ID=1)
```
GET http://localhost:8000/api/admin/usuarios/1
Authorization: Bearer {{token}}
```

---

## ⚙️ CONFIGURACIONES

### Ver IVA (público)
```
GET http://localhost:8000/api/config/iva
```

### Listar Configuraciones
```
GET http://localhost:8000/api/admin/configuraciones
Authorization: Bearer {{token}}
```

### Cambiar IVA a 18%
```
PUT http://localhost:8000/api/admin/configuraciones-iva
Authorization: Bearer {{token}}

{
  "porcentaje": 18
}
```

---

## 🗄️ VERIFICAR EN POSTGRESQL

```sql
-- Ver últimas facturas
SELECT * FROM facturas ORDER BY created_at DESC LIMIT 5;

-- Ver configuraciones
SELECT clave, valor FROM configuraciones;

-- Ver IVA actual
SELECT valor FROM configuraciones WHERE clave = 'iva_porcentaje';

-- Contar usuarios
SELECT COUNT(*) FROM usuarios;
```

---

## ✅ Checklist

- [ ] Login funciona
- [ ] Crear factura cliente
- [ ] Crear factura consumidor final
- [ ] Listar facturas
- [ ] Ver factura
- [ ] Actualizar factura
- [ ] Cambiar IVA
- [ ] Ver datos en BD

**¡Hecho!** 22 endpoints listos para testear
