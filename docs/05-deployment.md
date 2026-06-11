# 05 — Despliegue

La landing es un sitio **Astro** con output **estático**: `pnpm build` genera `dist/`, que se publica
tal cual. El deploy a GitHub Pages está **automatizado con GitHub Actions** (build incluido).

## Hosting recomendado: GitHub Pages con Actions (ya configurado)

El repo incluye `.github/workflows/deploy.yml`. En **cada push a `main`** (o a mano desde la pestaña
**Actions**):

1. Instala dependencias con pnpm, **compila Astro** y sube `dist/` como artefacto de Pages.
2. El `base` se toma automáticamente de Pages (`configure-pages` → `base_path`), así que las rutas
   quedan bajo `/screenpencil-landing/` sin tocar nada.
3. La primera vez intenta **activar Pages** solo (`enablement: true`). Si fallara por permisos, ve una
   vez a **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
4. El sitio queda en `https://gepres.github.io/screenpencil-landing/` (la URL exacta sale en el log).

> **Importante:** ahora el Source de Pages debe ser **GitHub Actions** (no "Deploy from a branch"):
> el sitio se **compila**, ya no se sirve la raíz del repo.

## Otros hostings

Todos sirven el directorio `dist/` tras `pnpm build`:

| Host | Build command | Output |
|------|---------------|--------|
| **Vercel** | `pnpm build` (detecta Astro) | `dist` |
| **Netlify** | `pnpm build` | `dist` |
| **Cloudflare Pages** | `pnpm build` | `dist` |

Para deploy en la **raíz** de un dominio (no en un subdirectorio), compila con `BASE_PATH=/`
(es el valor por defecto si no se define la variable).

## Variables de entorno (`astro.config.mjs`)

- `SITE_URL` — dominio público (canonical, OG, sitemap). Por defecto `https://gepres.github.io`.
- `BASE_PATH` — prefijo de ruta. `/screenpencil-landing/` en Pages de proyecto; `/` en raíz.

## Dominio personalizado

Apunta tu dominio (p. ej. `screenpencil.app`) al hosting y compila con `BASE_PATH=/`:
- **GitHub Pages:** añade `public/CNAME` con el dominio + registros DNS según su guía.
- **Vercel/Cloudflare/Netlify:** panel → *Domains* → asistente (HTTPS automático).

## Antes de publicar (producción)

- [ ] `pnpm build` sin errores.
- [ ] Enlaces de **descarga / GitHub / donación** y **versión** correctos (`src/data/site.ts`).
- [ ] `<title>`, `meta description`, canonical y Open Graph correctos.
- [ ] Banner OG (`public/assets/img/og-banner.png`) recomprimido a < 300 KB si quieres afinar.
- [ ] **Analítica:** token de Cloudflare y código de GoatCounter conectados (ver abajo).

## Analítica

Dos capas, ambas **sin cookies ni banner** de consentimiento. La instrumentación de eventos vive en
`src/scripts/main.ts`, función `track()` — un único punto de integración.

### 1. Tráfico — Cloudflare Web Analytics
Mide visitas, páginas, fuentes y países. Registra por **hostname** (`gepres.github.io`): en el panel,
filtra por *Path* = `/screenpencil-landing/` para aislar esta landing. El beacon se añade en
`Base.astro` (pendiente de pegar el token cuando se quiera activar).

### 2. Clics y flujo — GoatCounter

| Evento | `path` en el panel |
|--------|--------------------|
| Clic en Descargar | `download/<plataforma>` |
| Clic en GitHub | `github` |
| Clic en donación | `donate/<plataforma>` |
| Cambio de idioma | `lang/es`, `lang/en` |
| Uso de la demo (primer trazo) | `demo/used` |

`track()` llama a `window.goatcounter.count(...)` si el script de GoatCounter está cargado. Para
activarlo, añade el snippet de tu cuenta y los eventos empezarán a registrarse. El panel **`/admin`**
agrega ambas fuentes vía el backend NestJS.

> **¿Prefieres GA4?** Reescribe solo el **cuerpo de `track()`**; la instrumentación no cambia.

## Rendimiento

- Astro envía **~0 JS** salvo las islas (demo, showcase, toggle). CSS minificado por Vite.
- Sirve con **gzip/brotli** (los hosts anteriores lo hacen por defecto).
- (Pendiente) **self-host de fuentes** (`.woff2`) para evitar la latencia de Google Fonts.
