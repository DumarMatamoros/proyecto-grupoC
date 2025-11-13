# 🎛️ Guía: IVA y Configuraciones Dinámicas

## 🎯 Objetivo
Permitir que el porcentaje de IVA (y otras configuraciones) se cambien desde la interfaz sin tocar el código.

---

## 📊 Nuevos Componentes

### 1. **Tabla: configuraciones**
```sql
CREATE TABLE configuraciones (
  configuracion_id INT PRIMARY KEY AUTO_INCREMENT,
  clave VARCHAR(255) UNIQUE,           -- iva_porcentaje, descuento_maximo, etc
  valor TEXT,                          -- El valor de la configuración
  tipo VARCHAR(50),                    -- numeric, string, boolean, json
  descripcion TEXT,                    -- Descripción legible
  grupo VARCHAR(100),                  -- facturacion, sistema, etc
  editable BOOLEAN,                    -- ¿Se puede cambiar desde interfaz?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. **Modelo: Configuracion.php**
```php
// Métodos útiles:
Configuracion::obtener('iva_porcentaje', 12)     // Obtener con default
Configuracion::establecer('clave', valor, tipo)  // Guardar configuración
$config->getValorFormateado()                    // Obtener formateado
```

### 3. **Controlador: ConfiguracionController.php**
Endpoints para gestionar configuraciones

### 4. **Seeder: ConfiguracionSeeder.php**
Carga configuraciones iniciales

---

## 🔌 Nuevos Endpoints

### 1. Obtener IVA Actual (PÚBLICO - sin autenticación)
```
GET /api/config/iva

Respuesta (200):
{
  "success": true,
  "message": "IVA obtenido exitosamente",
  "data": {
    "porcentaje": 12,
    "valor_decimal": 0.12
  }
}
```

### 2. Listar Todas las Configuraciones (ADMIN)
```
GET /api/admin/configuraciones

Query Parameters (opcional):
  ?grupo=facturacion      - Filtrar por grupo
  ?editables=1            - Solo configuraciones editables

Respuesta (200):
{
  "success": true,
  "message": "Configuraciones obtenidas exitosamente",
  "data": [
    {
      "configuracion_id": 1,
      "clave": "iva_porcentaje",
      "valor": "12",
      "tipo": "numeric",
      "descripcion": "Porcentaje de IVA a aplicar...",
      "grupo": "facturacion",
      "editable": true,
      "created_at": "2025-11-13...",
      "updated_at": "2025-11-13..."
    },
    ...
  ]
}
```

### 3. Obtener una Configuración Específica (ADMIN)
```
GET /api/admin/configuraciones/iva_porcentaje

Respuesta (200):
{
  "success": true,
  "message": "Configuración obtenida exitosamente",
  "data": {
    "configuracion_id": 1,
    "clave": "iva_porcentaje",
    "valor": "12",
    "tipo": "numeric",
    ...
  }
}
```

### 4. Actualizar una Configuración (ADMIN)
```
PUT /api/admin/configuraciones/iva_porcentaje

Body:
{
  "valor": "15"
}

Respuesta (200):
{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "data": {
    "configuracion_id": 1,
    "clave": "iva_porcentaje",
    "valor": "15",
    ...
  }
}
```

### 5. Actualizar IVA Específicamente (ADMIN) ⭐
```
PUT /api/admin/configuraciones-iva

Body:
{
  "porcentaje": 18
}

Respuesta (200):
{
  "success": true,
  "message": "IVA actualizado exitosamente",
  "data": {
    "porcentaje": 18,
    "valor_decimal": 0.18
  }
}
```

---

## 💡 Cómo Funciona el IVA Dinámico

### Antes (Hardcodeado)
```php
$impuesto = $subtotal * 0.12; // 12% fijo
```

### Ahora (Dinámico)
```php
$porcentaje_iva = Configuracion::obtener('iva_porcentaje', 12);
$impuesto = $subtotal * ($porcentaje_iva / 100);
```

**Ventaja:** Cambiar el IVA en Postman actualiza automáticamente el cálculo para todas las nuevas facturas

---

## 🧪 Ejemplo: Cambiar IVA de 12% a 18%

### Paso 1: Login como Admin
```
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}
Guarda el token
```

### Paso 2: Obtener IVA Actual
```
GET /api/config/iva

Respuesta:
{
  "porcentaje": 12,
  "valor_decimal": 0.12
}
```

### Paso 3: Actualizar IVA
```
PUT /api/admin/configuraciones-iva
Headers:
  Authorization: Bearer {token}

Body:
{
  "porcentaje": 18
}

Respuesta:
{
  "porcentaje": 18,
  "valor_decimal": 0.18
}
```

### Paso 4: Crear Factura (Usará IVA 18%)
```
POST /api/facturas
{
  "cedula_cliente": "9999999999",
  "nombre_cliente": "CONSUMIDOR FINAL",
  "sucursal_id": 1,
  "items": [{
    "producto_id": 1,
    "cantidad": 1,
    "precio_unitario": 100
  }]
}

Respuesta:
{
  "subtotal": 100,
  "impuesto": 18,        // ← IVA 18%
  "total": 118
}
```

---

## 📋 Configuraciones Iniciales Disponibles

| Clave | Valor | Tipo | Grupo | Editable | Descripción |
|-------|-------|------|-------|----------|-------------|
| `iva_porcentaje` | 12 | numeric | facturacion | ✅ | Porcentaje de IVA |
| `numero_factura_prefijo` | FAC | string | facturacion | ✅ | Prefijo de factura |
| `descuento_maximo` | 20 | numeric | facturacion | ✅ | Descuento máximo permitido |
| `nombre_empresa` | Mi Empresa Ecuador | string | sistema | ✅ | Nombre de empresa |
| `ruc_empresa` | 1234567890001 | string | sistema | ✅ | RUC de empresa |
| `email_empresa` | info@empresa.com | string | sistema | ✅ | Email de empresa |

---

## 🔐 Restricciones de Seguridad

### Público (sin autenticación)
- ✅ `GET /api/config/iva` - Ver IVA actual

### Autenticado (cualquier usuario)
- ✅ Leer configuraciones propias (acceso futuro)

### Admin SOLO
- ✅ `GET /api/admin/configuraciones` - Listar todas
- ✅ `GET /api/admin/configuraciones/{clave}` - Ver una
- ✅ `PUT /api/admin/configuraciones/{clave}` - Actualizar
- ✅ `PUT /api/admin/configuraciones-iva` - Actualizar IVA

---

## 📝 Cómo Agregar Nuevas Configuraciones

### 1. Agregar al Seeder
```php
// database/seeders/ConfiguracionSeeder.php
Configuracion::updateOrCreate(
    ['clave' => 'mi_nueva_config'],
    [
        'valor' => 'valor_defecto',
        'tipo' => 'numeric',  // o string, boolean, json
        'grupo' => 'facturacion',
        'descripcion' => 'Descripción de qué es',
        'editable' => true,
    ]
);
```

### 2. Usar en Código
```php
$valor = Configuracion::obtener('mi_nueva_config', 'default');
```

### 3. Permitir edición desde UI
```
PUT /api/admin/configuraciones/mi_nueva_config
{
  "valor": "nuevo_valor"
}
```

---

## 🎯 Casos de Uso Futuros

### Próximas Configuraciones
- ✅ **Límite de crédito:** Máximo monto en crédito permitido
- ✅ **Descuentos:**  % de descuento según cantidad
- ✅ **Retenciones:** % a retener según tipo
- ✅ **Email:** SMTP para envío de facturas
- ✅ **Códigos:** Prefijos de transacciones

### Ejemplo: Configurar Descuento Automático
```php
// En facturaController, agregar lógica:
$descuento_maximo = Configuracion::obtener('descuento_maximo', 20);
$descuento = min($request->descuento, $descuento_maximo);
```

---

## 🔄 Flujo de Actualización

```
Usuario Admin abre interfaz
    ↓
Hace click en "Cambiar IVA"
    ↓
Selecciona nuevo porcentaje (ej: 18)
    ↓
Frontend ejecuta: PUT /api/admin/configuraciones-iva
    ↓
ConfiguracionController::actualizarIVA() valida
    ↓
Guardar en BD: UPDATE configuraciones SET valor=18
    ↓
Respuesta: {"success": true, "porcentaje": 18}
    ↓
Siguiente factura usa IVA 18%
    ↓
FacturaController usa: Configuracion::obtener('iva_porcentaje', 12)
    ↓
Cálculo: impuesto = subtotal * (18/100)
```

---

## ✅ Validaciones

### IVA Porcentaje
- ✅ Requerido
- ✅ Numérico
- ✅ Mínimo: 0
- ✅ Máximo: 100

### Todas las Configuraciones
- ✅ Solo admins pueden actualizar
- ✅ Solo configuraciones con `editable=true` pueden modificarse
- ✅ Requiere autenticación Sanctum

---

## 🛡️ Nota Importante

**El IVA se aplica en el momento de crear la factura.**

Cambiar el IVA:
- ✅ Afecta facturas futuras
- ❌ NO afecta facturas ya creadas

Si necesitas cambiar IVA de facturas pasadas:
1. Anular la factura antigua
2. Crear nueva factura con nuevo IVA

---

## 🧪 Testing en Postman

### Paso 1: Obtener IVA Actual
```
GET http://localhost:8000/api/config/iva
```
(Sin autenticación - cualquiera puede verlo)

### Paso 2: Login
```
POST http://localhost:8000/api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Paso 3: Cambiar IVA
```
PUT http://localhost:8000/api/admin/configuraciones-iva
Headers:
  Authorization: Bearer {token}

Body:
{
  "porcentaje": 16
}
```

### Paso 4: Verificar
```
GET http://localhost:8000/api/config/iva
(Debería mostrar 16)
```

---

## 💾 Datos Persistidos

Todas las configuraciones se guardan en la BD:
```sql
SELECT * FROM configuraciones;
```

Persisten entre:
- ✅ Reinicios de servidor
- ✅ Sesiones diferentes
- ✅ Usuarios diferentes

---

## 🚀 Próximos Pasos

1. ✅ **Implementado:** Sistema de configuraciones dinámicas
2. ✅ **Implementado:** IVA configurable
3. 🔄 **Próximo:** Crear UI en React para cambiar configuraciones
4. 🔄 **Próximo:** Agregar más configuraciones (descuentos, retenciones)
5. 🔄 **Próximo:** Auditoría de cambios de configuración
