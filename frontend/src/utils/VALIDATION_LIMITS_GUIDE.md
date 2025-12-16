# Límites de Campos - Validación Frontend y Backend

## Resumen de Cambios

Se han definido límites máximos específicos en el frontend que coinciden con las validaciones del backend. Las notificaciones ahora aparecen por encima de cualquier elemento (z-index: 9999).

## Límites de Productos

| Campo | Min | Max | Tipo | Backend |
|-------|-----|-----|------|---------|
| `codigo_principal` | - | 100 caracteres | string | `max:100` |
| `codigo_barras` | - | 100 caracteres | string | `max:100` |
| `nombre` | - | 500 caracteres | string | `max:500` |
| `descripcion` | - | 2000 caracteres | string | `max:2000` |
| `precio_costo` | 0 | 999,999.99 | decimal | `numeric, min:0` |
| `precio_unitario` | 0 | 999,999.99 | decimal | `numeric, min:0` |
| `stock_actual` | 0 | 999,999 | entero | `integer, min:0` |
| `imagen` | - | 4 MB | archivo | `image, max:4096KB` |

## Límites de Categorías

| Campo | Max | Backend |
|-------|-----|---------|
| `nombre` | 255 caracteres | `max:255` |
| `descripcion` | 500 caracteres | `max:500` |

## Implementación en el Frontend

### 1. Archivo de Constantes: `validationLimits.js`

```javascript
export const PRODUCT_LIMITS = {
  precio_costo: {
    min: 0,
    max: 999999.99,
    step: 0.01,
    label: 'Precio de Costo'
  },
  precio_unitario: {
    min: 0,
    max: 999999.99,
    step: 0.01,
    label: 'Precio de Venta'
  },
  stock_actual: {
    min: 0,
    max: 999999,
    step: 1,
    label: 'Stock'
  },
  // ... más campos
};
```

### 2. Atributos HTML Aplicados

**Input de número:**
```jsx
<input
  type="number"
  min={PRODUCT_LIMITS.precio_costo.min}
  max={PRODUCT_LIMITS.precio_costo.max}
  step={PRODUCT_LIMITS.precio_costo.step}
/>
```

**Input de texto:**
```jsx
<input
  type="text"
  maxLength={PRODUCT_LIMITS.nombre.max}
/>
```

**Textarea:**
```jsx
<textarea
  maxLength={PRODUCT_LIMITS.descripcion.max}
/>
```

## Notificaciones (Toast)

### Z-Index de Notificaciones

**Antes:** `z-50`
**Después:** `z-[9999]`

Las notificaciones ahora aparecen por encima de:
- Modales (`z-50`)
- Dropdowns (`z-20`)
- Cualquier otro elemento en la página

**Mejora adicional:** Se agregó `pointer-events-none` al contenedor y `pointer-events-auto` a cada notificación para permitir interacción solo cuando sea necesario.

## Archivos Modificados

1. **`frontend/src/utils/validationLimits.js`** (Nuevo)
   - Define todos los límites del sistema
   - Proporciona funciones de validación

2. **`frontend/src/pages/Producto.jsx`**
   - Import de `PRODUCT_LIMITS`
   - Agregados `max`, `maxLength` y `step` a los inputs

3. **`frontend/src/pages/Categoria.jsx`**
   - Import de `CATEGORY_LIMITS`
   - Agregados `maxLength` a los inputs

4. **`frontend/src/components/ToastNotification.jsx`**
   - Z-index actualizado de `z-50` a `z-[9999]`
   - Agregados `pointer-events-none/auto` para mejor UX

## Ejemplo de Validación

Cuando el usuario intenta ingresar un valor fuera de los límites:

```
Precio de Costo: 1,000,000 → ❌ No se permite (max: 999,999.99)
Nombre: "Lorem ipsum dolor sit amet..." (>500 caracteres) → ❌ Truncado a 500
Stock: -5 → ❌ No se permite (min: 0)
```

## Próximas Integraciones

Estos límites pueden aplicarse a otras páginas:
- `Egresos.jsx`
- `Facturacion.jsx`
- `Ingresos.jsx`
- Cualquier otra página con formularios
