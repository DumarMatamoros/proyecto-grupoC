# 📚 Frontend React - Variables y Referencias

Sistema de Inventario y Facturación (Frontend)

---

## 🔑 Variables Globales y de Configuración

### 1. **`VITE_API_URL`** (Variable de Entorno)
- **Tipo**: `string`
- **Valor**: `http://localhost:8000/api`
- **Ubicación**: `.env` (archivo de configuración)
- **Uso**: Base URL para todas las llamadas a la API
- **Dónde se usa**:
  - `api.js` - Creación de instancia axios
  - `Facturacion.jsx` - Peticiones HTTP
  - `Registro.jsx` - Registro de usuarios

---

## 🔐 Autenticación

### 2. **`token`** (localStorage)
- **Tipo**: `string` (JWT token)
- **Almacenamiento**: `localStorage.getItem("token")`
- **Origen**: Recibido del backend en `/auth/login`
- **Uso**: Autenticación en peticiones protegidas
- **Dónde se usa**:
  - `api.js` - Interceptor para agregar `Authorization: Bearer {token}`
  - `ProtectedRoute.jsx` - Verificación de rutas privadas
  - `authService.js` - Gestión de sesión
  - `Topbar.jsx` - Cerrar sesión

### 3. **`user`** (localStorage)
- **Tipo**: `object` (JSON serializado)
- **Almacenamiento**: `localStorage.getItem("user")`
- **Estructura**:
  ```json
  {
    "id": number,
    "nombre": string,
    "email": string,
    "tipo": string
  }
  ```
- **Origen**: Recibido del backend en `/auth/login`
- **Uso**: Información del usuario autenticado
- **Dónde se usa**:
  - `Topbar.jsx` - Mostrar nombre del usuario
  - `authService.js` - Obtener datos del usuario

---

## 📄 Páginas y Sus Variables

### 4. **Login.jsx**
| Variable | Tipo | Uso |
|----------|------|-----|
| `email` | string | Email ingresado por el usuario |
| `password` | string | Contraseña ingresada |
| `error` | string | Mensaje de error de autenticación |
| `navigate` | function | Redirección a otras rutas |

### 5. **Registro.jsx**
| Variable | Tipo | Uso |
|----------|------|-----|
| `nombre` | string | Nombre completo del nuevo usuario |
| `email` | string | Email del nuevo usuario |
| `tipo` | string | Rol: `administrador`, `empleado`, `cliente`, `proveedor` |
| `password` | string | Contraseña |
| `password2` | string | Confirmación de contraseña |
| `error` | string | Errores del registro |

**❓ Duda**: `password_confirmation` en backend - Laravel requiere este nombre exacto para validación.

### 6. **PanelPrincipal.jsx** (Dashboard)
| Variable | Tipo | Uso |
|----------|------|-----|
| `stats` | object | Contiene: `usuarios`, `categorias`, `productos`, `ventas` |
| `ventasChartRef` | ref | Referencia al canvas del gráfico |
| `chartInstance` | ref | Instancia de Chart.js |

**❓ Dudas**:
- Los datos vienen de endpoints: `/admin/usuarios`, `/categorias`, `/productos`, `/facturas`
- El gráfico es estático (datos hardcodeados: `[2, 5, 3, 8, 4, 7]`)
- ¿Dónde se obtienen realmente los datos mensuales de ventas?

### 7. **Producto.jsx** (Inventario)
| Variable | Tipo | Uso |
|----------|------|-----|
| `productos` | array | Lista de productos del sistema |
| `categorias` | array | Lista de categorías disponibles |
| `modal` | boolean | Mostrar/ocultar modal de crear/editar |
| `editing` | null \| number | ID del producto en edición (null si es nuevo) |
| `search` | string | Búsqueda por nombre o código |
| `preview` | string | URL preview de la imagen |
| `dragActive` | boolean | Estado de drag & drop |
| `form` | object | Datos del formulario |

**Estructura de `form`**:
```javascript
{
  codigo_principal: string,
  nombre: string,
  descripcion: string,
  precio_unitario: number,
  stock_actual: number,
  categoria_id: number,
  imagen: File | null,
  iva_aplica: 0 | 1,
  ice_aplica: 0 | 1
}
```

**❓ Dudas**:
- ¿`codigo_principal` es único? ¿Se valida en backend?
- ¿Dónde se almacenan las imágenes? → `http://localhost:8000/storage/{p.imagen}`
- ¿Los checkboxes `iva_aplica` y `ice_aplica` afectan cálculos en facturación?

### 8. **Categoria.jsx**
| Variable | Tipo | Uso |
|----------|------|-----|
| `nombre` | string | Nombre de la categoría |
| `descripcion` | string | Descripción de la categoría |
| `categorias` | array | Lista de categorías |

### 9. **Facturacion.jsx**
| Variable | Tipo | Uso |
|----------|------|-----|
| `invoices` | array | Lista de facturas |
| `API` | string | URL de la API (desde `VITE_API_URL`) |

**❓ Dudas**:
- ¿El endpoint es `/invoices` o `/facturas`? (En `PanelPrincipal.jsx` usa `/facturas`)
- ¿Existe método `authService.getToken()`? (No está en `authService.js`)

### 10. **RecuperarClave.jsx**
| Variable | Tipo | Uso |
|----------|------|-----|
| `register` | function | Hook de `react-hook-form` |
| `handleSubmit` | function | Manejo del submit |

**❓ Duda**: ¿Existe método `authService.forgotPassword()`? No aparece en `authService.js`

---

## 🔧 Servicios y Utilidades

### 11. **api.js** (Configuración de Axios)
```javascript
baseURL: import.meta.env.VITE_API_URL
timeout: 8000 // ms
```

**Interceptor**: Agrega automáticamente header `Authorization: Bearer {token}`

**❓ Duda**: ¿Hay manejo de errores globales si el token expira?

### 12. **authService.js** (Gestión de Autenticación)
| Método | Descripción |
|--------|-------------|
| `login(email, password)` | Autentica usuario y guarda token + user |
| `logout()` | Limpia localStorage |
| `getUser()` | Obtiene objeto usuario del localStorage |
| `isAuthenticated()` | Valida si existe token |

**❓ Dudas**:
- Falta método `getToken()` (usado en `Facturacion.jsx`)
- Falta método `forgotPassword()` (usado en `RecuperarClave.jsx`)

---

## 🛣️ Rutas (App.jsx)

| Ruta | Componente | Tipo | Acceso |
|------|-----------|------|--------|
| `/` | Redirige a `/login` | Pública | Todos |
| `/login` | `Login` | Pública | No autenticado |
| `/registro` | `Registro` | Pública | No autenticado |
| `/recuperar-clave` | `RecuperarClave` | Pública | No autenticado |
| `/panel` | `PanelPrincipal` | Privada | Autenticado |
| `/Productos` | `Producto` | Privada | Autenticado |
| `/categoria` | `Categoria` | Privada | Autenticado |
| `/facturacion` | `Facturacion` | Privada | Autenticado |
| `*` | Redirige a `/login` | Pública | Todos |

**❓ Dudas**:
- ¿Existe componente `Layout`? Usado en rutas protegidas
- ¿Existe componente `ProtectedRoute`? Valida autenticación
- Ruta `/Productos` con mayúscula (inconsistencia con otras)

---

## 🎯 Componentes Base (Presumidos)

| Componente | Ubicación | Uso |
|-----------|----------|-----|
| `Layout` | `components/Layout.jsx` | Envolvedor de rutas privadas |
| `ProtectedRoute` | `components/ProtectedRoute.jsx` | Validación de autenticación |
| `Topbar` | `components/Topbar.jsx` | Barra superior con usuario |
| `Sidebar` | `components/Sidebar.jsx` | Menú lateral |
| `Button` | `components/Button.jsx` | Botón reutilizable |
| `Input` | `components/Input.jsx` | Input reutilizable |

---

## 📡 Endpoints API Utilizados

| Método | Endpoint | Componente | Parámetros |
|--------|----------|-----------|-----------|
| POST | `/auth/login` | `Login.jsx` | `{email, password}` |
| POST | `/auth/register` | `Registro.jsx` | `{nombre, email, tipo, password, password_confirmation}` |
| GET | `/admin/usuarios` | `PanelPrincipal.jsx` | - |
| GET | `/categorias` | `Categoria.jsx`, `Producto.jsx`, `PanelPrincipal.jsx` | - |
| POST | `/categorias` | `Categoria.jsx` | `{nombre, descripcion}` |
| DELETE | `/categorias/{id}` | `Categoria.jsx` | - |
| GET | `/productos` | `Producto.jsx`, `PanelPrincipal.jsx` | - |
| POST | `/productos` | `Producto.jsx` | FormData |
| PUT | `/productos/{id}` | `Producto.jsx` | FormData |
| DELETE | `/productos/{id}` | `Producto.jsx` | - |
| GET | `/facturas` | `PanelPrincipal.jsx` | - |
| GET | `/invoices` | `Facturacion.jsx` | - |
| POST | `/invoices` | `Facturacion.jsx` | `{total}` |

---

## ⚠️ Problemas y Dudas Identificadas

### Críticos
1. **❌ Métodos faltantes en `authService.js`**:
   - `getToken()` - usado en `Facturacion.jsx`
   - `forgotPassword()` - usado en `RecuperarClave.jsx`

2. **❌ Inconsistencia en endpoints**:
   - `Facturacion.jsx` usa `/invoices`
   - `PanelPrincipal.jsx` usa `/facturas`
   - ¿Cuál es el correcto?

3. **❌ Componentes faltantes**:
   - `components/Button.jsx`
   - `components/Input.jsx`
   - Posiblemente otros

### Funcionales
4. **❓ Datos estáticos en gráfico**: El dashboard muestra ventas hardcodeadas `[2, 5, 3, 8, 4, 7]`

5. **❓ Manejo de errores**: No hay validación global de token expirado

6. **❓ Validaciones**: ¿Se validan campos en cliente o solo en servidor?

7. **❓ Permisos**: ¿Hay control de roles (admin, empleado, etc.)? No se ve en rutas

8. **❓ IVA e ICE**: ¿Se usan los valores `iva_aplica` y `ice_aplica` en cálculos de facturas?

---

## 🚀 Pasos para Comenzar

1. Configurar `.env` con `VITE_API_URL=http://localhost:8000/api`
2. Instalar dependencias: `npm install`
3. Iniciar servidor: `npm run dev`
4. Resolver métodos faltantes en `authService.js`
5. Verificar endpoints y rutas del backend

---

## 📦 Dependencias Principales

- `react` - Framework UI
- `react-router-dom` - Enrutamiento
- `axios` - Cliente HTTP
- `react-icons` - Iconos
- `chart.js` - Gráficos
- `tailwindcss` - Estilos CSS
- `react-hook-form` - Gestión de formularios

---

**Última actualización**: 20 de Noviembre, 2025
