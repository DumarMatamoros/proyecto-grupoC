# Sistema de Inventario y Facturación - Frontend

Este repositorio contiene la interfaz de usuario desarrollada en **React** con **Vite**. La aplicación está desplegada en la nube para garantizar alta disponibilidad.

## 🚀 Despliegue
* **Plataforma de Hosting:** Vercel.
* **URL de Producción:** [Pega aquí tu URL de Vercel].
* **Conectividad:** Se comunica con el Backend mediante un túnel seguro de Cloudflare.

## 🛠️ Tecnologías
* React.js
* Vite

## ⚙️ Configuración de Entorno
Para que el frontend funcione, se debe configurar la siguiente variable en el panel de Vercel:
`VITE_API_URL`: URL generada por el túnel de Cloudflare (ej. `https://soonest-medline-pixels-oral.trycloudflare.com/api`).

# Sistema de Inventario y Facturación - Backend API

Este repositorio contiene la lógica de negocio y la gestión de datos del sistema, desplegado en un servidor local bajo una arquitectura de microservicios y contenedores.

## 🏗️ Arquitectura del Servidor
El sistema reside en un servidor físico con **Ubuntu Server 24.04**. La infraestructura se divide en:
* **API REST:** Desarrollada en **Laravel 11** y **PHP 8.3**.
* **Servidor Web:** **Nginx** actuando como proxy inverso.
* **Base de Datos:** **PostgreSQL 16** ejecutándose en **Docker** (Primary/Standby).

## 🔒 Seguridad y Conectividad
* **Administración:** Gestión remota vía SSH a través de una red privada virtual con **Tailscale**.
* **Exposición Pública:** Uso de **Cloudflare Tunnel** para exponer la API sin necesidad de apertura de puertos en el router local.

## 🐳 Comandos de Verificación
Para validar el estado del sistema en el servidor:
* **Verificar DB:** `docker ps`
* **Verificar Túnel:** `ps aux | grep cloudflared`
* **Logs de Laravel:** `tail -f storage/logs/laravel.log`

## 📍 Ubicación del Despliegue
A diferencia del frontend, este componente se encuentra en un servidor **On-premise** para control total de los datos y la lógica de facturación.

