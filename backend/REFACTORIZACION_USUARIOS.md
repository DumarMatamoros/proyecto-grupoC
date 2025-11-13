# Guía de Refactorización: Tabla Usuarios Base

## Cambios Realizados

Se ha creado una nueva estructura jerárquica con `usuarios` como tabla base de la que dependen `empleados`, `clientes`, `proveedores` y `administrador`.

### Nuevas Migraciones Creadas:

1. **`2025_11_12_000001_create_usuarios_base_table.php`** 
   - Tabla base `usuarios` con campos: `usuario_id`, `nombre`, `email`, `password`, `tipo`, etc.

2. **`2025_11_12_235016_create_empleados_table_v2.php`**
   - Tabla `empleados` que referencia a `usuarios`
   - Campo `usuario_id` como llave foránea
   - Nuevos campos: `departamento`, `fecha_inicio`
   - Eliminados: `nombre`, `usuario`, `password` (ahora en `usuarios`)

3. **`2025_11_12_235014_create_clientes_table_v2.php`**
   - Tabla `clientes` que referencia a `usuarios`
   - Campo `usuario_id` como llave foránea
   - Eliminados: `nombre`, `correo` (ahora en `usuarios`)

4. **`2025_11_12_235015_create_proveedores_table_v2.php`**
   - Tabla `proveedores` que referencia a `usuarios`
   - Campo `usuario_id` como llave foránea
   - Nuevo campo: `sitio_web`
   - Eliminados: `nombre`, `correo` (ahora en `usuarios`)

5. **`2025_11_12_235020_create_administradores_table.php`**
   - Nueva tabla `administradores` que referencia a `usuarios`
   - Campos: `nivel`, `permisos` (JSON)

### Modelos Actualizados:

1. **`User.php`**
   - Ahora apunta a tabla `usuarios`
   - Clave primaria: `usuario_id`
   - Relaciones añadidas: `empleado()`, `cliente()`, `proveedor()`, `administrador()`

2. **`Empleado.php`**
   - Actualizado para usar `usuario_id` en lugar de campos propios
   - Relación: `usuario()` como `belongsTo`

3. **`Cliente.php`**
   - Actualizado para usar `usuario_id` 
   - Relación: `usuario()` como `belongsTo`

4. **`Proveedor.php`**
   - Actualizado para usar `usuario_id`
   - Relación: `usuario()` como `belongsTo`

5. **`Administrador.php`** (NUEVO)
   - Nuevo modelo para administradores
   - Relación: `usuario()` como `belongsTo`

## Pasos Siguientes:

### 1. Deshacer Migraciones Antiguas (Si ya fueron ejecutadas)
**IMPORTANTE**: Si las migraciones antiguas ya fueron ejecutadas, debes revertirlas primero:

```bash
php artisan migrate:reset
```

Esto revertirá TODAS las migraciones. Alternativamente, puedes revertir solo las más recientes:
```bash
php artisan migrate:rollback --step=5
```

### 2. Eliminar o Renombrar Migraciones Antiguas
Debes eliminar las siguientes migraciones antiguas para evitar conflictos (o renombrarlas con prefijo `OLD_`):

**DEBEN SER ELIMINADAS:**
- `2025_11_12_235016_create_empleados_table.php` ← REEMPLAZADA por `_v2.php`
- `2025_11_12_235015_create_proveedores_table.php` ← REEMPLAZADA por `_v2.php`
- `2025_11_12_235014_create_clientes_table.php` ← REEMPLAZADA por `_v2.php`

**DEBE SER MODIFICADA O ELIMINADA:**
- `0001_01_01_000000_create_users_table.php` ← REEMPLAZADA por tabla `usuarios`

### 3. Orden Correcto de Ejecución
Asegúrate de que el orden de las migraciones sea correcto (por timestamp):
1. `2025_11_12_000001_create_usuarios_base_table.php` ← **PRIMERO (base)**
2. `2025_11_12_235013_create_sucursales_table.php` (ya existe)
3. `2025_11_12_235014_create_clientes_table_v2.php` ← Nueva versión
4. `2025_11_12_235015_create_categorias_table.php` (ya existe)
5. `2025_11_12_235015_create_impuestos_table.php` (ya existe)
6. `2025_11_12_235015_create_proveedores_table_v2.php` ← Nueva versión
7. `2025_11_12_235016_create_empleados_table_v2.php` ← Nueva versión
8. `2025_11_12_235016_create_productos_table.php` (ya existe)
9. Y el resto de migraciones...

### 4. Ejecutar Nuevas Migraciones
```bash
php artisan migrate
```

### 5. Actualizar Seeders (si existen)
Actualizar `DatabaseSeeder.php` y cualquier factory para crear usuarios con el nuevo modelo.

### 6. Tablas que NO Necesitan Cambios
Las siguientes tablas ya están correctamente configuradas y mantienen sus referencias sin cambios:
- `bitacoras` → referencia a `empleado_id` ✓
- `facturas` → referencia a `cliente_id` y `empleado_id` ✓
- `compras` → referencia a `proveedor_id` ✓
- `detalle_facturas` → referencias a `factura_id` y `producto_id` ✓
- `detalle_compras` → referencias a `compra_id` y `producto_id` ✓
- `movimientos_inventario` → referencia a `producto_id` ✓

### 7. Verificar Relaciones en otros Modelos
Los siguientes modelos deben tener relaciones correctas:
- `Bitacora.php` - relación con `Empleado` ✓
- `Factura.php` - relaciones con `Cliente` y `Empleado` ✓
- `Compra.php` - relación con `Proveedor` ✓
- `DetalleFactura.php` - relaciones con `Factura` y `Producto` ✓
- `DetalleCompra.php` - relaciones con `Compra` y `Producto` ✓

## Estructura de Datos

```
usuarios (tabla base)
├── empleados (usuario_id)
├── clientes (usuario_id)
├── proveedores (usuario_id)
└── administradores (usuario_id)
```

## Ejemplo de Uso en Código

### Crear un empleado con su usuario:
```php
// Crear usuario
$usuario = User::create([
    'nombre' => 'Juan Pérez',
    'email' => 'juan@example.com',
    'password' => bcrypt('password'),
    'tipo' => 'empleado',
]);

// Crear empleado asociado
$empleado = Empleado::create([
    'usuario_id' => $usuario->usuario_id,
    'sucursal_id' => 1,
    'departamento' => 'Ventas',
    'fecha_inicio' => now(),
]);
```

### Acceder a los datos:
```php
$empleado = Empleado::first();
$usuario = $empleado->usuario; // Obtiene el usuario asociado
$nombre = $usuario->nombre; // Accede al nombre desde el usuario
```

## Notas Importantes

- Las llaves foráneas tienen `onDelete('cascade')` para mantener integridad referencial
- El campo `tipo` en `usuarios` ayuda a identificar qué tipo de usuario es
- Se recomienda crear índices en `usuario_id` para mejorar el rendimiento de las consultas
