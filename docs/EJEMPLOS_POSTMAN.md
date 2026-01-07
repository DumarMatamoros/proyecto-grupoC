# 🇪🇨 POSTMAN · COLECCIÓN DE EJEMPLOS
## Sistema de Facturación Electrónica – Ecuador

Moneda: USD  
IVA: 15%  
Cédula: 10 dígitos  
RUC: 13 dígitos  
Consumidor Final: 9999999999999

==================================================

## 🔐 AUTENTICACIÓN

### Login
POST http://localhost:8000/api/auth/login

{
  "email": "admin@example.com",
  "password": "password"
}

--------------------------------------------------

### Ver Mi Perfil
GET http://localhost:8000/api/auth/me
Authorization: Bearer {{token}}

==================================================

## 📄 FACTURACIÓN

### Crear Factura – Cliente
POST http://localhost:8000/api/facturas
Authorization: Bearer {{token}}

{
  "cliente_id": 1,
  "cedula_cliente": "0912345678",
  "nombre_cliente": "Comercial La Favorita",
  "sucursal_id": 1,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 12.50
    }
  ]
}

--------------------------------------------------

### Crear Factura – Consumidor Final
POST http://localhost:8000/api/facturas
Authorization: Bearer {{token}}

{
  "cedula_cliente": "9999999999999",
  "nombre_cliente": "CONSUMIDOR FINAL",
  "sucursal_id": 1,
  "items": [
    {
      "producto_id": 2,
      "cantidad": 1,
      "precio_unitario": 5.00
    }
  ]
}

--------------------------------------------------

### Listar Facturas
GET http://localhost:8000/api/facturas
Authorization: Bearer {{token}}

--------------------------------------------------

### Ver Factura (ID = 1)
GET http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}

--------------------------------------------------

### Actualizar Factura
PUT http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}

{
  "estado": "emitida"
}

--------------------------------------------------

### Eliminar Factura
DELETE http://localhost:8000/api/facturas/1
Authorization: Bearer {{token}}

==================================================

## 👨‍💼 ADMIN · USUARIOS

### Dashboard
GET http://localhost:8000/api/admin/dashboard
Authorization: Bearer {{token}}

--------------------------------------------------

### Listar Usuarios
GET http://localhost:8000/api/admin/usuarios
Authorization: Bearer {{token}}

--------------------------------------------------

### Listar Solo Clientes
GET http://localhost:8000/api/admin/usuarios?tipo=cliente
Authorization: Bearer {{token}}

--------------------------------------------------

### Ver Usuario (ID = 1)
GET http://localhost:8000/api/admin/usuarios/1
Authorization: Bearer {{token}}

--------------------------------------------------

### Registrar Cliente
POST http://localhost:8000/api/auth/register

{
  "nombre": "Juan Pérez",
  "email": "juan.perez@correo.ec",
  "password": "Cliente123",
  "password_confirmation": "Cliente123",
  "ruc_cedula": "0912345678001",
  "razon_social": "JP Servicios Técnicos",
  "direccion": "Av. 9 de Octubre y Boyacá, Guayaquil",
  "telefono": "0991234567",
  "tipo": "cliente"
}

--------------------------------------------------

### Registrar Administrador
POST http://localhost:8000/api/auth/register

{
  "nombre": "María Rodríguez",
  "email": "admin@empresa.ec",
  "password": "Admin12345",
  "password_confirmation": "Admin12345",
  "ruc_cedula": "1790012345001",
  "razon_social": "Empresa Demo S.A.",
  "direccion": "Av. Amazonas y Naciones Unidas, Quito",
  "telefono": "0987654321",
  "tipo": "administrador"
}

--------------------------------------------------

### Registrar Empleado
POST http://localhost:8000/api/auth/register

{
  "nombre": "Carlos Gómez",
  "email": "carlos.gomez@empresa.ec",
  "password": "Empleado123",
  "password_confirmation": "Empleado123",
  "ruc_cedula": "0923456789",
  "razon_social": "Empleado Empresa",
  "direccion": "Cdla. Alborada, Guayaquil",
  "telefono": "0974561230",
  "tipo": "empleado"
}

--------------------------------------------------

### Actualizar Usuario
PUT http://localhost:8000/api/admin/usuarios/1
Authorization: Bearer {{token}}

{
  "nombre": "Juan Pérez Actualizado",
  "email": "juan.actualizado@correo.ec"
}

--------------------------------------------------

### Eliminar Usuario
DELETE http://localhost:8000/api/admin/usuarios/22
Authorization: Bearer {{token}}

--------------------------------------------------

### Mi Información (Admin)
GET http://localhost:8000/api/admin/info
Authorization: Bearer {{token}}

--------------------------------------------------

### Actualizar Mi Perfil
PUT http://localhost:8000/api/auth/perfil
Authorization: Bearer {{token}}

{
  "nombre": "Administrador Principal",
  "email": "admin.nuevo@empresa.ec"
}

==================================================

## ⚙️ CONFIGURACIONES

### Ver IVA (Público)
GET http://localhost:8000/api/config/iva

--------------------------------------------------

### Listar Configuraciones
GET http://localhost:8000/api/admin/configuraciones
Authorization: Bearer {{token}}

--------------------------------------------------

### Cambiar IVA (15%)
PUT http://localhost:8000/api/admin/configuraciones-iva
Authorization: Bearer {{token}}

{
  "porcentaje": 15
}

==================================================

## 🗄️ POSTGRESQL · CONSULTAS

SELECT * FROM facturas ORDER BY created_at DESC LIMIT 5;

SELECT clave, valor FROM configuraciones;

SELECT valor FROM configuraciones WHERE clave = 'iva_porcentaje';

SELECT COUNT(*) FROM usuarios;

SELECT usuario_id, nombre, email, tipo FROM usuarios;

SELECT usuario_id, nombre, email FROM usuarios WHERE tipo = 'administrador';

UPDATE usuarios SET tipo = 'administrador' WHERE usuario_id = 5;

SELECT * FROM administradores;

==================================================

## ✅ CHECKLIST

[ ] Login  
[ ] Registrar usuario  
[ ] Listar usuarios  
[ ] Crear factura cliente  
[ ] Crear factura consumidor final  
[ ] Listar / ver / actualizar factura  
[ ] Configurar IVA  
[ ] Verificar datos en BD