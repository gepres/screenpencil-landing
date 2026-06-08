# 06 — Panel admin (analytics)

`admin.html` es un **dashboard interno** que muestra la analítica del sitio consumiendo el
**backend NestJS** (`screenpencil-backend`). No contiene tokens: pide la API key y la guarda
solo en el navegador.

## Cómo funciona
- **Archivos:** `admin.html` + `assets/css/admin.css` + `assets/js/admin.js`.
- **Acceso:** por URL directa `…/admin.html` (no está enlazado en el nav público). `noindex,nofollow`.
- **Config (⚙):** URL del backend + API key (`x-api-key`), guardadas en `localStorage`.
  - URL por defecto: `https://screenpencil-backend.onrender.com` (producción).
  - Para desarrollo local del backend, cámbiala a `http://localhost:3333`.
- **Datos:** llama a 3 endpoints del backend (con `x-api-key`):
  - `GET /analytics/summary?period=…` → KPIs + paneles (top páginas, países, fuentes) por fuente.
  - `GET /analytics/timeseries?period=…` → gráfico de líneas SVG (GoatCounter + Cloudflare).
  - `GET /analytics/events?period=…` → panel de eventos (descargas, donaciones, demo, showcase…).
  - `period`: `24h` / `7d` / `30d` / `90d`.
- **Render:** KPIs, dos paneles (GoatCounter / Cloudflare) con barras CSS, gráfico SVG (sin librerías)
  y lista de eventos. Carga resiliente: si serie/eventos fallan, el resumen igual se muestra.

## Backend (resumen)
- Repo: **`screenpencil-backend`** (NestJS 11 + PostgreSQL/Neon + Prisma). Desplegado en **Render**.
- Guarda los tokens (GoatCounter REST + Cloudflare GraphQL), agrega ambas fuentes y **cachea** en
  Postgres (`MetricSnapshot`, TTL 10 min). Protegido por `ADMIN_API_KEY` (cabecera `x-api-key`).
- CORS: permite `https://gepres.github.io` en producción.
- Detalle completo en `screenpencil-backend/docs/`.

## Notas / limitaciones
- La API key vive en el navegador (limitación de un panel estático). Endurecer en el futuro con
  **auth real** (JWT) o **Cloudflare Access** delante del backend.
- `GOATCOUNTER_SITE`/tokens y el `CLOUDFLARE_SITE_TAG` (¡que NO es el token del beacon!) se configuran
  en el backend, no aquí.
