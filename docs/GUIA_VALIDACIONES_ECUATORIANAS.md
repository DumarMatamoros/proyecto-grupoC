# Guía de Validaciones Ecuatorianas

## Validadores Personalizados Creados

El sistema incluye validadores específicos para números ecuatorianos que garantizan integridad de datos y cumplimiento normativo.

### 1. Cédula Ecuatoriana (CedulaEcuatoriana)

**Validaciones:**
- Exactamente 10 dígitos
- No puede contener todos dígitos iguales
- Algoritmo de verificación (módulo 10) según SRI

**Uso:**
```php
new CedulaEcuatoriana()
```

**Ejemplo de cédula válida:**
- `1010334256` - Válida
- `1234567890` - Inválida (no pasa verificación)
- `1111111111` - Inválida (todos iguales)
- `123456789` - Inválida (menos de 10 dígitos)

**Algoritmo:**
1. Se multiplica cada uno de los 9 primeros dígitos por coeficientes [2,3,4,5,6,7,8,9,2]
2. Si el producto es mayor a 9, se resta 9
3. Se suma todos los resultados
4. Se calcula (10 - (suma % 10)) % 10
5. El resultado debe coincidir con el dígito verificador (10º dígito)

---

### 2. Teléfono Ecuatoriano (TelefonoEcuatoriano)

**Validaciones:**
- Exactamente 10 dígitos (sin caracteres especiales)
- Comienza con códigos válidos: 0, 2, 6, 9
- No puede contener todos dígitos iguales

**Uso:**
```php
new TelefonoEcuatoriano()
```

**Ejemplos válidos:**
- `0992123456` - Celular (Claro, Movistar, CNT)
- `0987654321` - Celular
- `0212345678` - Teléfono fijo
- `0629876543` - Teléfono fijo
- `0986543210` - Celular

**Códigos de operadores:**
- **09**: Movistar, Claro, CNT (Celular)
- **06**: Números de acceso especial
- **02**: Teléfono fijo (Pichincha)
- **0X**: Otros códigos regionales para fijos

---

### 3. RUC Ecuatoriano (RucEcuatoriano)

**Validaciones:**
- Exactamente 13 dígitos
- Primeros 10 dígitos deben ser una cédula válida
- Algoritmo de verificación (módulo 11) según SRI

**Uso:**
```php
new RucEcuatoriano()
```

**Estructura RUC:**
```
[CÉDULA (10 DÍGITOS)][ENTIDAD (3 DÍGITOS)][VERIFICADOR (1 DÍGITO)]
    └─────────────┬────────────────┘       └────────┬─────────┘
                  │                                 │
         Primeros 10 dígitos              Últimos 3 dígitos
         de la cédula válida
```

**Ejemplo:**
- RUC: `1010334256001` 
  - Cédula: `1010334256`
  - Entidad: `001`
  - Verificador: (calculado automáticamente)

**Algoritmo:**
1. Se multiplica cada uno de los 12 primeros dígitos por coeficientes [3,2,7,6,5,4,3,2,7,6,5,4]
2. Si el producto es mayor a 9, se resta 9
3. Se suma todos los resultados
4. Se calcula (11 - (suma % 11))
5. Si es 11 → 0, Si es 10 → 1
6. El resultado debe coincidir con el dígito verificador (13º dígito)

---

## Requests Personalizados

### StoreClienteRequest

Valida los datos de registro de clientes:

```json
{
  "nombre": "Acme Corporation",
  "email": "contacto@acme.com",
  "password": "segura123",
  "password_confirmation": "segura123",
  "ruc_cedula": "1010334256",
  "razon_social": "Acme Corp S.A.",
  "direccion": "Calle Principal 123, Quito",
  "telefono": "0992123456",
  "tipo": "juridica"
}
```

**Validaciones:**
- Cédula: 10 dígitos válidos (CedulaEcuatoriana)
- Teléfono: 10 dígitos ecuatoriano válido
- Email: único en la tabla usuarios
- Tipo: "natural" o "juridica"

---

### StoreProveedorRequest

Valida los datos de registro de proveedores:

```json
{
  "nombre": "Distribuidora XYZ",
  "email": "info@distribuidora.com",
  "password": "segura123",
  "password_confirmation": "segura123",
  "ruc": "1010334256001",
  "razon_social": "Distribuidora XYZ S.A.",
  "direccion": "Av. Industriales 456, Guayaquil",
  "telefono": "0421234567",
  "sitio_web": "https://www.distribuidora.com"
}
```

**Validaciones:**
- RUC: 13 dígitos válidos (RucEcuatoriano)
- Teléfono: 10 dígitos ecuatoriano válido
- Email: único en la tabla usuarios
- Sitio web: URL válida (opcional)

---

### StoreEmpleadoRequest

Valida los datos de registro de empleados:

```json
{
  "nombre": "Juan Pérez García",
  "email": "juan.perez@empresa.com",
  "password": "segura123",
  "password_confirmation": "segura123",
  "cedula": "1010334256",
  "telefono": "0987654321",
  "sucursal_id": 1,
  "departamento": "Ventas",
  "fecha_inicio": "2025-01-15"
}
```

**Validaciones:**
- Cédula: 10 dígitos válidos (CedulaEcuatoriana)
- Teléfono: 10 dígitos ecuatoriano válido
- Sucursal: debe existir en la BD
- Email: único en la tabla usuarios
- Fecha: formato válido

---

## Ejemplos de Respuestas de Validación

### Cédula Inválida

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

### Teléfono Inválido

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

### RUC Inválido

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

## Generar Cédulas y RUCs Válidos para Pruebas

### Cédulas válidas (10 dígitos):
- `1010334256`
- `1715555689`
- `1718989797`
- `1720123456`

### RUCs válidos (13 dígitos):
- `1010334256001`
- `1715555689001`
- `1718989797001`

### Teléfonos válidos (10 dígitos):
- `0992123456` (Celular)
- `0987654321` (Celular)
- `0212345678` (Fijo)
- `0426543210` (Fijo)

---

## Integración en la API

Las validaciones se aplican automáticamente en los endpoints de registro:

**POST** `/api/auth/register`
- Se valida la cédula si se proporciona (para clientes)

**POST** `/api/clientes` (próximamente)
- Se valida cédula y teléfono

**POST** `/api/proveedores` (próximamente)
- Se valida RUC y teléfono

**POST** `/api/empleados` (próximamente)
- Se valida cédula y teléfono

---

## Notas Técnicas

1. **Algoritmo de Cédula**: Basado en el algoritmo de módulo 10 del SRI (Servicio de Rentas Internas)
2. **Algoritmo de RUC**: Basado en el algoritmo de módulo 11 del SRI
3. **Formato de Teléfono**: Requiere exactamente 10 dígitos, sin espacios ni caracteres especiales
4. **Validación única**: Las cédulas y RUCs son únicos en la BD por cada tabla
5. **Caracteres especiales**: Los validadores aceptan y limpian automáticamente espacios, guiones y paréntesis en teléfonos
