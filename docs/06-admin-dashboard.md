# 06 — Panel admin (analytics)

El panel **`/admin`** es un **dashboard interno** que muestra la analítica del sitio consumiendo el
**backend NestJS** (`screenpencil-backend`). No contiene tokens: pide la API key y la guarda
solo en el navegador.

## Cómo funciona
- **Archivos:** `src/pages/admin.astro` (página aislada, Tailwind + `global.css`) + `src/scripts/admin.ts`
  (entry: config, fetch, `load()`, listeners) + `src/scripts/admin/` → `types.ts` (formas API),
  `format.ts` (helpers puros), `charts.ts` (primitivas SVG), `render.ts` (un `render<Sección>()` por bloque).
  Dependency-free; Vite lo bundlea en un solo chunk. `noindex,nofollow`.
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
  - `GET /panel/action-series?period=…` → **acciones en el tiempo** (serie diaria por evento).
  - `period`: `24h` / `7d` / `30d` / `90d`.
- **Visualizaciones:** KPIs con **sparkline + tendencia** (5: páginas vistas GC, páginas vistas CF,
  visitas CF y **clics en descargar / en donar**) · gráfica de área con **tooltip** · **funnel**
  visitas→demo→showcase→descarga · comparación por fuente · países (con banderas)/fuentes · eventos
  **agrupados** · **dispositivos** · **heatmap día×hora** · **por hora del día** y **por día de la
  semana** · **profundidad de lectura** (scroll 25→100%) · **rendimiento** (FCP/carga) · **acciones en
  el tiempo** (serie diaria por evento) · **donuts** de navegador/SO · **export CSV**.
- **Descargas y donaciones** (sección propia, justo tras el funnel): una tarjeta por intención con el
  total de clics, el **% sobre las visitas**, la media diaria, el mejor día, la **serie diaria** de toda
  la familia de eventos, la **ruta hasta el clic** (pulsó un CTA → llegó a la sección → hizo clic, con
  el % de conversión sobre quienes vieron la sección) y el **desglose por destino** con nombres
  legibles (Microsoft Store, instalador de Windows, Mac App Store, Linux, Google Play · Buy me a
  coffee, GitHub Sponsors, PayPal). Cuenta **clics de intención, no instalaciones ni donaciones
  cobradas**: eso no lo expone ninguna tienda ni pasarela.
- **Degradación elegante:** si `/devices` o el `hourly` no están (backend sin desplegar), esas dos
  secciones muestran un aviso "requiere endpoint" en vez de romper.

## Instrumentación (qué se mide en la landing)
`src/scripts/main.ts` registra vía GoatCounter (`track()`): `download/*`, `github`, `donate/*`,
`lang/*`, `demo/used`, `showcase/*`, **`section/<id>`** (qué secciones llega a ver),
**`scroll/25|50|75|100`** (profundidad) y **`cta/download` · `cta/donate`** (los enlaces internos
que llevan a esas secciones: hero, nav, demo, cierre y footer, marcados con `data-cta`). Esto
alimenta el funnel, "acciones de los usuarios" y "descargas y donaciones".

> Dos familias distintas, no las confundas: `cta/*` es la **intención** (pulsó el botón de la
> landing) y `download/*` / `donate/*` es el **clic de salida** (se fue a la tienda o a la pasarela).
> La clave del evento es el valor del `data-download` / `data-donate` / `data-cta` del enlace, así
> que al añadir un botón nuevo basta con marcarlo.

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
