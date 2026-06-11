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
- **Datos:** 5 endpoints del backend (con `x-api-key`), carga resiliente con `Promise.allSettled`.
  ⚠️ El panel usa el prefijo **neutro `/panel/*`** (no `/analytics/*`) porque los bloqueadores de
  anuncios/rastreo tumban cualquier URL con "analytics"/"events" → `ERR_BLOCKED_BY_CLIENT` (no carga
  ningún dato). El backend sirve **ambos** prefijos (`analytics` y `panel`) como alias.
  - `GET /panel/summary?period=…` → KPIs, comparación GoatCounter↔Cloudflare, países, fuentes.
  - `GET /panel/timeseries?period=…` → gráfica de área (GC+CF), **heatmap** y **patrones de tiempo** (campo `hourly`).
  - `GET /panel/actions?period=…` → **funnel**, **acciones agrupadas** y **profundidad de lectura** (alias de `events`).
  - `GET /panel/devices?period=…` → **dispositivos** (navegador · SO · pantalla).
  - `GET /panel/vitals?period=…` → **rendimiento** (FCP, tiempo de carga; Cloudflare RUM).
  - `period`: `24h` / `7d` / `30d` / `90d`.
- **Visualizaciones:** KPIs con **sparkline + tendencia** · gráfica de área con **tooltip** · **funnel**
  visitas→demo→showcase→descarga · comparación por fuente · países (con banderas)/fuentes · eventos
  **agrupados** · **dispositivos** · **heatmap día×hora** · **por hora del día** y **por día de la
  semana** · **profundidad de lectura** (scroll 25→100%) · **rendimiento** (FCP/carga) · **export CSV**.
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
- Las KPIs muestran **tendencia interna** del periodo (último tercio vs primero), **no** un delta real
  vs el periodo anterior (eso requeriría que el backend devuelva también el resumen del periodo previo).
- **Dispositivos** y **heatmap** dependen de `/panel/devices` y del campo `hourly`; si el backend no los
  expone, esas dos secciones muestran un aviso "requiere endpoint" en vez de romper.
- Visibilidad del panel: se alterna la **clase** Tailwind `hidden` (no el atributo) — mezclarlos dejaba
  el dashboard en `display:none` aunque hubiera datos.
- `GOATCOUNTER_SITE`/tokens y el `CLOUDFLARE_SITE_TAG` (¡que NO es el token del beacon!) se configuran
  en el backend, no aquí.
- Más ideas de mejora (auth, deltas reales, Web Vitals, serie por evento…): ver [NEXT-STEPS](NEXT-STEPS.md).
