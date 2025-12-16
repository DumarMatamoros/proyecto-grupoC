# Sistema de Mensajes de Error

## Descripción

El módulo `errorTranslator.js` traduce mensajes técnicos de error de PostgreSQL, Laravel y APIs HTTP en mensajes amigables y comprensibles para el usuario final.

## Uso

### Importar el módulo

```javascript
import { getErrorMessage, translateError } from "../utils/errorTranslator";
```

### En bloques try-catch

```javascript
try {
  await api.post('/endpoint', data);
} catch (error) {
  toast.error(getErrorMessage(error));
}
```

## Tipos de Errores Traducidos

### 1. Restricciones de Unicidad (Unique Constraint)
- **Error original:** `duplicate key value violates unique constraint "productos_codigo_principal_key"`
- **Mensaje traducido:** `Este código principal ya existe. Por favor, use otro código.`

### 2. Restricciones de Clave Foránea (Foreign Key)
- **Error original:** `update or delete on table "categorias" violates foreign key constraint`
- **Mensaje traducido:** `No se puede eliminar esta categoría porque tiene productos asociados.`

### 3. Campos Requeridos (NOT NULL)
- **Error original:** `null value in column "nombre" violates not-null constraint`
- **Mensaje traducido:** `El nombre es obligatorio.`

### 4. Tipos de Dato Inválidos
- **Error original:** `invalid input syntax for type numeric`
- **Mensaje traducido:** `Por favor, ingrese un número válido.`

### 5. Validaciones de Rango (Check Constraints)
- **Error original:** `new row for relation "productos" violates check constraint "productos_stock_check"`
- **Mensaje traducido:** `La cantidad de stock debe ser mayor o igual a cero.`

### 6. Validaciones de Laravel - Números Mínimos
- **Error original:** `The precio_costo field must be at least 0.`
- **Mensaje traducido:** `El precio de costo debe ser al menos 0.`

### 7. Validaciones de Laravel - Números Negativos
- **Error original:** `The stock field must be at least 0.` o campo con valor negativo
- **Mensaje traducido:** `La cantidad no puede ser negativa. Por favor, ingrese un valor mayor o igual a 0.`

### 8. Validaciones de Laravel - Números Muy Grandes
- **Error original:** `The precio_costo field must not be greater than 999999.99` o `El valor debe ser menor o igual que 999999.99.`
- **Mensaje traducido:** `El precio de costo no puede ser mayor a 999,999.99.`

### 9. Cédula/RUC Ecuatoriano Inválido
- **Error original:** `cédula ecuatoriana inválida`
- **Mensaje traducido:** `La cédula ingresada no es válida. Por favor, verifique.`

### 10. Conexión y Timeout
- **Error original:** `ECONNREFUSED` o `timeout`
- **Mensaje traducido:** `No se pudo conectar con el servidor. Por favor, intente más tarde.`

### 11. Autorización
- **Error original:** `Unauthorized` o `Forbidden`
- **Mensaje traducido:** `No tiene permiso para realizar esta acción.`

## Ejemplos de Casos Comunes

| Error Técnico | Mensaje Amigable |
|---|---|
| `unique constraint "productos_codigo_barras_key"` | Este código de barras ya existe. Por favor, use otro código. |
| `foreign key constraint "categorias"` | No se puede eliminar esta categoría porque tiene productos asociados. |
| `not null constraint "nombre"` | El nombre es obligatorio. |
| `invalid input syntax for type numeric` | Por favor, ingrese un número válido. |
| `check constraint "stock"` | La cantidad de stock debe ser mayor o igual a cero. |
| `The precio_costo field must be at least 0` | El precio de costo debe ser al menos 0. |
| `The stock field must be at least 0` | El stock debe ser al menos 0. |
| `must be at least 0` (campo negativo) | La cantidad no puede ser negativa. Por favor, ingrese un valor mayor o igual a 0. |
| `The precio_costo field must not be greater than 999999.99` | El precio de costo no puede ser mayor a 999,999.99. |
| `El valor debe ser menor o igual que 999999.99` | El valor ingresado es demasiado grande. El máximo permitido es 999999.99. |
| `must not be greater than 999999` | La cantidad no puede ser mayor a 999,999. |
| `cédula ecuatoriana inválida` | La cédula ingresada no es válida. Por favor, verifique. |
| `ECONNREFUSED` | No se pudo conectar con el servidor. Por favor, intente más tarde. |

## Agregar Nuevas Traducciones

Para agregar una nueva traducción:

1. Abre `frontend/src/utils/errorTranslator.js`
2. Agrega una nueva condición en la función `translateError()`:

```javascript
// En la función translateError() dentro del if correspondiente:
if (messageStr.includes('tu_patron_error')) {
  return 'Tu mensaje amigable aquí';
}
```

3. O crea un nuevo `if` para un tipo de error:

```javascript
// Nuevos errores de [Tipo]
if (messageStr.includes('patron_nuevo')) {
  if (messageStr.includes('subpatron1')) return 'Mensaje 1';
  if (messageStr.includes('subpatron2')) return 'Mensaje 2';
  return 'Mensaje genérico';
}
```

## Notas de Implementación

- Los patrones se comparan en minúsculas (`toLowerCase()`)
- Siempre verifica patrones específicos primero, luego los genéricos
- Los mensajes deben ser claros, breves y orientados al usuario
- Evita tecnicismos y términos de base de datos
- Sugiere soluciones cuando sea posible ("Por favor, intente con otro...")

## Archivos que Usan Este Sistema

- `frontend/src/pages/Producto.jsx`
- `frontend/src/pages/Categoria.jsx`

## Próximas Páginas para Implementación

- `frontend/src/pages/Egresos.jsx`
- `frontend/src/pages/Facturacion.jsx`
- `frontend/src/pages/Ingresos.jsx`
- `frontend/src/pages/Registro.jsx`
- `frontend/src/pages/Login.jsx`
