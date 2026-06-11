# 06 — Panel admin (analytics)

El panel **`/admin`** es un **dashboard interno** que muestra la analítica del sitio consumiendo el
**backend NestJS** (`screenpencil-backend`). No contiene tokens: pide la API key y la guarda
solo en el navegador.

## Cómo funciona
- **Archivos:** `src/pages/admin.astro` (página aislada, Tailwind + `global.css`) + `src/scripts/admin.ts`
  (dependency-free; charts en SVG hechos a mano). `noindex,nofollow`.
- **Acceso:** por URL directa `…/screenpencil-landing/admin` (no está enlazado en el nav público).
- **Config (⚙):** URL del backend + API key (`x-api-key`), guardadas en `localStorage`
  (claves `sp-admin-*`). Por defecto `https://screenpencil-backend.onrender.com`.
- **Datos:** 4 endpoints del backend (con `x-api-key`), carga resiliente con `Promise.allSettled`:
  - `GET /analytics/summary?period=…` → KPIs, comparación GoatCounter↔Cloudflare, países, fuentes.
  - `GET /analytics/timeseries?period=…` → gráfica de área (GC+CF) y **heatmap** (campo `hourly`).
  - `GET /analytics/events?period=…` → **funnel** y **acciones agrupadas** (descargas/donaciones/engagement/navegación).
  - `GET /analytics/devices?period=…` → **dispositivos** (navegador · SO · pantalla). *(endpoint nuevo)*
  - `period`: `24h` / `7d` / `30d` / `90d`.
- **Visualizaciones:** KPIs con **sparkline + tendencia** del periodo · gráfica de área con **tooltip** ·
  **funnel** visitas→demo→showcase→descarga · comparación por fuente · barras de países/fuentes ·
  eventos **agrupados** por categoría · **dispositivos** y **heatmap día×hora**.
- **Degradación elegante:** si `/devices` o el `hourly` no están (backend sin desplegar), esas dos
  secciones muestran un aviso "requiere endpoint" en vez de romper.

## Instrumentación (qué se mide en la landing)
`src/scripts/main.ts` registra vía GoatCounter (`track()`): `download/*`, `github`, `donate/*`,
`lang/*`, `demo/used`, `showcase/*`, **`section/<id>`** (qué secciones llega a ver) y
**`scroll/25|50|75|100`** (profundidad). Esto alimenta el funnel y "acciones de los usuarios".

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
