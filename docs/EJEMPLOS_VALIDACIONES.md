# Ejemplos de Prueba - Validaciones Ecuatorianas

## Cédulas Válidas para Probar

```
1010334256 ✓ Válida
1715555689 ✓ Válida
1718989797 ✓ Válida
1720123456 ✓ Válida
0910000001 ✓ Válida
1234567890 ✗ Inválida (no pasa verificación)
1111111111 ✗ Inválida (todos iguales)
```

## Teléfonos Válidos para Probar

```
0992123456 ✓ Válido (Celular - 09)
0987654321 ✓ Válido (Celular - 09)
0982123456 ✓ Válido (Celular - 09)
0212345678 ✓ Válido (Fijo - 02)
0426543210 ✓ Válido (Fijo - 04 o 06)
0622222222 ✓ Válido (Acceso especial - 06)
0999999999 ✗ Inválido (todos iguales)
1234567890 ✗ Inválido (no comienza con código válido)
```

## RUCs Válidos para Probar

```
1010334256001 ✓ Válido
1715555689001 ✓ Válido
1718989797001 ✓ Válido
1720123456001 ✓ Válido
```

---

## Prueba 1: Registrar Cliente con Validación

**Endpoint:** `POST /api/auth/register`

**Body exitoso:**
```json
{
  "nombre": "Tienda ABC",
  "email": "tienda@abc.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ruc_cedula": "1010334256",
  "razon_social": "Tienda ABC S.A.",
  "direccion": "Calle 1, Quito",
  "telefono": "0992123456",
  "tipo": "cliente"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "usuario_id": 22,
      "nombre": "Tienda ABC",
      "email": "tienda@abc.com",
      "tipo": "cliente",
      "email_verified_at": null,
      "created_at": "2025-11-13T17:00:00.000000Z",
      "updated_at": "2025-11-13T17:00:00.000000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

---

## Prueba 2: Registrar Cliente con Cédula Inválida

**Body con error:**
```json
{
  "nombre": "Tienda XYZ",
  "email": "tienda@xyz.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ruc_cedula": "1234567890",
  "razon_social": "Tienda XYZ S.A.",
  "direccion": "Calle 2, Quito",
  "telefono": "0987654321",
  "tipo": "cliente"
}
```

**Respuesta esperada (422):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": {
    "ruc_cedula": [
      "La ruc_cedula no es válida."
    ]
  }
}
```

---

## Prueba 3: Registrar Cliente con Teléfono Inválido

**Body con error:**
```json
{
  "nombre": "Tienda DEF",
  "email": "tienda@def.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ruc_cedula": "1010334256",
  "razon_social": "Tienda DEF S.A.",
  "direccion": "Calle 3, Quito",
  "telefono": "1234567890",
  "tipo": "cliente"
}
```

**Respuesta esperada (422):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": {
    "telefono": [
      "El telefono debe ser un número de 10 dígitos."
    ]
  }
}
```

---

## Prueba 4: Registrar Proveedor con RUC Válido

**Endpoint:** `POST /api/auth/register`

**Body exitoso:**
```json
{
  "nombre": "Distribuidora Global",
  "email": "info@global.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ruc": "1010334256001",
  "razon_social": "Distribuidora Global S.A.",
  "direccion": "Av. Principal 100, Guayaquil",
  "telefono": "0426543210",
  "sitio_web": "https://www.global.com",
  "tipo": "proveedor"
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
      "nombre": "Distribuidora Global",
      "email": "info@global.com",
      "tipo": "proveedor",
      "created_at": "2025-11-13T17:01:00.000000Z",
      "updated_at": "2025-11-13T17:01:00.000000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  }
}
```

---

## Prueba 5: Registrar Proveedor con RUC Inválido

**Body con error:**
```json
{
  "nombre": "Distribuidora Fake",
  "email": "info@fake.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "ruc": "1234567890123",
  "razon_social": "Distribuidora Fake S.A.",
  "direccion": "Calle Falsa 123",
  "telefono": "0212345678",
  "tipo": "proveedor"
}
```

**Respuesta esperada (422):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": {
    "ruc": [
      "El ruc no es válido."
    ]
  }
}
```

---

## Prueba 6: Teléfono con Caracteres Especiales (Se limpian automáticamente)

**Body:**
```json
{
  "nombre": "Cliente Especial",
  "email": "cliente@especial.com",
  "telefono": "0992-123-4567",
  "tipo": "cliente"
}
```

El validador acepta:
- `0992-123-4567` ✓ (Se convierte a `0992123456`)
- `0992 123 4567` ✓ (Se convierte a `0992123456`)
- `(099) 2123-4567` ✓ (Se convierte a `0992123456`)
- `0992123456` ✓ (Ya es válido)

---

## Verificación en Base de Datos

Después de registrar usuarios exitosamente, puedes verificar en PostgreSQL:

```sql
-- Ver clientes registrados
SELECT u.nombre, u.email, c.ruc_cedula, c.telefono, c.tipo
FROM usuarios u
JOIN clientes c ON u.usuario_id = c.usuario_id
WHERE u.tipo = 'cliente';

-- Ver proveedores registrados
SELECT u.nombre, u.email, p.ruc, p.telefono
FROM usuarios u
JOIN proveedores p ON u.usuario_id = p.usuario_id
WHERE u.tipo = 'proveedor';

-- Ver empleados registrados
SELECT u.nombre, u.email, e.sucursal_id, e.departamento
FROM usuarios u
JOIN empleados e ON u.usuario_id = e.usuario_id
WHERE u.tipo = 'empleado';
```

---

## Notas para Pruebas

1. **Cédulas únicas**: Cada cédula debe ser única en su tabla. No puedes registrar dos clientes con la misma cédula.

2. **RUCs únicos**: Cada RUC debe ser único en la tabla de proveedores.

3. **Emails únicos**: Cada email debe ser único en la tabla de usuarios.

4. **Teléfonos**: No hay restricción de unicidad en teléfonos (pueden compartir).

5. **Formato**: Los validadores son case-insensitive para campos de texto, pero los números deben ser exactos.

6. **Errores múltiples**: Si hay varios errores, recibirás un array con todos:

```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": {
    "ruc_cedula": ["La ruc_cedula no es válida."],
    "telefono": ["El telefono debe ser un número de 10 dígitos."],
    "email": ["El email ya está en uso."]
  }
}
```

---

## Generador de Cédulas Válidas

Si necesitas generar más cédulas válidas para pruebas, usa este algoritmo:

```javascript
function generarCedulaValida() {
    // Generar código de provincia (01-24)
    const provincia = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
    
    // Generar 6 dígitos aleatorios
    const secuencial = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    
    const primeros9 = provincia + secuencial;
    
    // Calcular verificador
    const coeficientes = [2, 3, 4, 5, 6, 7, 8, 9, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
        let producto = parseInt(primeros9[i]) * coeficientes[i];
        if (producto > 9) producto -= 9;
        suma += producto;
    }
    
    const verificador = (10 - (suma % 10)) % 10;
    
    return primeros9 + verificador;
}

// Generar algunas cédulas
console.log(generarCedulaValida()); // Ej: 1010334256
console.log(generarCedulaValida()); // Ej: 1715555689
```
