# NEXT-STEPS — Mejoras pendientes (próxima sesión)

Estado y pendientes del **ecosistema ScreenPencil** (landing + backend + app). Actualizar al cerrar
cada sesión. Última actualización: **2026-06-11**.

## Estado actual (hecho)
- **Landing** (`screenpencil-landing`, GitHub Pages): **migrada a Astro 5 + Tailwind v4** (antes
  HTML/CSS/JS vanilla) con rediseño minimalista — todo el contenido intacto (15 funciones, 20 atajos,
  3 plataformas, FAQ, roadmap). Bilingüe ES/EN (componente `<T>`), hero con captura real, showcase con
  pestañas, donaciones conectadas (PayPal/Coffee/GitHub Sponsors), capturas WebP, analítica (Cloudflare
  + GoatCounter), **panel `/admin`** conectado al backend, **SEO** (structured data, canonical, OG/Twitter,
  sitemap, robots) y **banner social** propio (`og-banner.png`). **Descargas conectadas:** botón de
  Windows → release real **v0.2.1**; badge de versión vía API de GitHub. **Deploy con build de Astro en
  GitHub Actions** (base path automático de Pages).
- **Panel `/admin`** (en la landing): **reescrito en Astro + Tailwind** (dependency-free), reemplazando
  el vanilla heredado. KPIs con **sparkline + tendencia**, gráfica de **área con tooltip** (GoatCounter
  vs Cloudflare), **funnel** (visitas→demo→showcase→descarga), comparación por fuente, países/fuentes,
  **acciones agrupadas**, **dispositivos** y **heatmap día×hora**. Llama al backend por el prefijo
  **neutro `/panel/*`** (los adblockers bloquean `/analytics`/`events` → `ERR_BLOCKED_BY_CLIENT`).
- **Instrumentación** (landing, `main.ts`): además de `download/github/donate/lang/demo`, ahora registra
  `section/<id>` (qué secciones ve), `scroll/25·50·75·100` y `showcase/<id>` → alimenta el funnel.
- **Backend** (`screenpencil-backend`, NestJS + Neon + Prisma): **desplegado en Render**
  (`https://screenpencil-backend.onrender.com`). Endpoints `/health` y **4** de analítica
  (`summary`, `events`/`actions`, `timeseries` con `hourly[24]`, `devices`), servidos bajo `/analytics`
  **y** `/panel`. API key, agregación GoatCounter + Cloudflare y caché en Postgres.
- **App de escritorio** (`screenbrush-windown` / `screenpencil-app`): **v0.2.1**. Windows estable (Fases 1-7,
  48 tests): overlay, dibujo completo, multi-monitor, Ajustes, 7 idiomas, captura. **Instalador** (Inno Setup) +
  **release automatizado** (CI) al repo público de vitrina **`gepres/screenpencil-releases`**. **App macOS
  funcional** (`ScreenPencil.Mac`, Avalonia + AppKit): bienvenida, toolbar, herramientas, hotkeys, captura.

## Pendientes — Landing
- [ ] **Optimizar fuentes** (self-host `.woff2`) para no depender de Google Fonts.
- [ ] **Recomprimir `og-banner.png`** (hoy ~1.2 MB) a < 300 KB para previews sociales más rápidos.
- [ ] Cuando exista build de **macOS/Linux**, activar sus botones de descarga (hoy *Próximamente*)
      en `src/components/Download.astro` / `Hero.astro` y `src/data/site.ts`.
- [ ] **Revisar densidad visual** ahora que está todo el contenido en una sola página (que no se sienta larga).
- [ ] (Opcional) borrar la carpeta prototipo `screenpencil-landing-v2` (ya migrada aquí).
- [x] ~~Rebuild del panel `/admin` + instrumentación de navegación~~ → **hecho** (Astro/Tailwind, funnel,
      heatmap, dispositivos, acciones agrupadas; rutas neutras `/panel/*` anti-adblock).
- [x] ~~Pase de rendimiento (jank de runtime)~~ → **hecho**: nav `backdrop-blur` xl→md sobre fondo animado,
      blobs `blur` 64→44px + `contain:layout paint`, quitado `backdrop-filter` de float-cards,
      glow del cursor con rect cacheado + rAF (sin reflujo), `content-visibility:auto` en 9 secciones.
- [x] ~~Migrar a Astro + adaptar GitHub Actions con build~~ → **hecho**.
- [x] ~~Fullpage scroll~~ → **retirado** en el rediseño (scroll normal, secciones que respiran).
- [x] ~~Botones de **Descargar** del hero/precio~~ → **conectados** al release v0.2.1 (`screenpencil-releases`).
- [x] ~~Imagen Open Graph 1200×630 propia~~ → **hecha** (`og-banner.png`).

## Pendientes — Backend
- [ ] **Tests** unitarios para `getEvents`, `getTimeseries` y `getDevices` (hoy solo `getSummary`).
- [ ] **`DATABASE_URL` directa** (sin `-pooler`) en Render para futuras migraciones (evitar locks de PgBouncer).
- [ ] **Mantener "caliente"** el free tier de Render (cron de ping) para evitar cold start ~50 s.
- [ ] **F4 — Auth real** del `/admin` (JWT o Cloudflare Access) en vez de API key en el navegador.
- [ ] Warning de `pg`/`sslmode=require`: dejar explícito (`sslmode=verify-full` o `uselibpqcompat=true`).

## Pendientes — App de escritorio
- [ ] Confirmación **multi-pantalla** del usuario (Windows).
- [ ] **Firma de código** (Windows): el instalador y el release automatizado ya están; falta el certificado
      para evitar el aviso de SmartScreen. Ver `screenbrush-windown/docs/12`.
- [ ] Fase 7 restante: **snapshots + export PDF**, **quick-arrow / `Ctrl+1..0`**, edición posterior de texto
      (badges, ghost mode y cursor halo ya están).
- [ ] **macOS:** firma **Developer ID** + **notarización** + `.dmg`, y QA en Mac real (Fases 5/6 de `docs/18`).
- [ ] **Linux:** planificado (reutiliza la cabeza Avalonia ya madura en Mac + interop X11; `docs/19`).

## Recomendaciones — Analítica / panel `/admin`

**Alto valor**
- [ ] **Auth real** del `/admin` (JWT o **Cloudflare Access** delante del backend) en vez de API key en
      `localStorage`. Es la mayor mejora de seguridad: hoy quien abra el navegador ve la clave.
- [ ] **Deltas reales vs periodo anterior.** Las KPIs muestran *tendencia interna* del periodo (último
      tercio vs primero). Para un % real "vs los 7 días anteriores", el backend debe aceptar un rango/offset
      y devolver también el resumen del periodo previo (un `range`/`compare=prev` en la query).
- [ ] **Mantener Render caliente** (cron de ping cada ~10 min) → mata el cold-start de ~50 s que sufre
      el panel en el primer fetch.

**Más datos / gráficas**
- [x] ~~Web Vitals / rendimiento (Cloudflare RUM)~~ → **hecho**: `/panel/vitals` con FCP y tiempo de
      carga (p50/p75). ⚠️ Verificar los nombres de campo `quantiles` contra la API real (`firstContentfulPaint*`,
      `pageLoadTime*`); si una métrica sale vacía, revisar el log de Render y ajustar el campo.
- [x] ~~Patrones de tiempo~~ → **hecho**: "por hora del día" + "por día de la semana" (columnas).
- [x] ~~Profundidad de lectura~~ → **hecho**: funnel scroll 25→50→75→100% desde los eventos instrumentados.
- [x] ~~Export CSV~~ → **hecho** (botón ⤓) · banderas de país en el ranking.
- [ ] **Serie temporal por evento** (p. ej. descargas/día), no solo el total. GoatCounter `/stats/hits`
      con desglose diario por evento, o explotar el **historial de `MetricSnapshot`**.
- [ ] **Rango de fechas personalizado** (date picker) además de los presets 24h/7d/30d/90d.
- [ ] **Mapa mundial** de países (en vez de barras).

## Repos
- Landing: `github.com/gepres/screenpencil-landing` → `https://gepres.github.io/screenpencil-landing/`
- Backend: `github.com/gepres/screenpencil-backend` → `https://screenpencil-backend.onrender.com`
- App (privado): `github.com/gepres/screenpencil-app`
- Releases (vitrina pública): `github.com/gepres/screenpencil-releases` → `/releases/latest`
