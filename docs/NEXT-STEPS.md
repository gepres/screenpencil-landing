# NEXT-STEPS — Mejoras pendientes (próxima sesión)

Estado y pendientes del **ecosistema ScreenPencil** (landing + backend + app). Actualizar al cerrar
cada sesión. Última actualización: **2026-06-10**.

## Estado actual (hecho)
- **Landing** (`screenpencil-landing`, GitHub Pages): bilingüe ES/EN, hero con captura real, showcase
  con pestañas, donaciones conectadas (PayPal/Coffee/GitHub Sponsors), capturas en WebP, analítica
  (Cloudflare + GoatCounter), **panel `/admin`** conectado al backend, **fullpage scroll** (CSS snap),
  **SEO** (structured data, canonical, OG/Twitter, sitemap, robots) y **banner social** propio (`og-banner.png`).
  **Descargas conectadas:** botón de Windows → release real **v0.2.1**; badge de versión vía API de GitHub.
- **Backend** (`screenpencil-backend`, NestJS + Neon + Prisma): **desplegado en Render**
  (`https://screenpencil-backend.onrender.com`). Endpoints `/health`, `/analytics/summary|events|timeseries`
  con API key, agregación GoatCounter + Cloudflare y caché en Postgres. `partial:false` con datos reales.
- **App de escritorio** (`screenbrush-windown` / `screenpencil-app`): **v0.2.1**. Windows estable (Fases 1-7,
  48 tests): overlay, dibujo completo, multi-monitor, Ajustes, 7 idiomas, captura. **Instalador** (Inno Setup) +
  **release automatizado** (CI) al repo público de vitrina **`gepres/screenpencil-releases`**. **App macOS
  funcional** (`ScreenPencil.Mac`, Avalonia + AppKit): bienvenida, toolbar, herramientas, hotkeys, captura.

## Pendientes — Landing
- [ ] **Validar el fullpage scroll** en distintas alturas de pantalla. Secciones largas (12
      funciones, atajos 3 columnas, FAQ) pueden no caber en 100vh → revisar recorte / contenido bajo el nav.
  - Ajustes posibles: `scroll-padding-top` para el nav; `mandatory` → `proximity` si se siente brusco;
    reducir contenido por panel (menos funciones/atajos por pantalla).
  - Archivos: `assets/css/fullpage.css`, `assets/js/fullpage.js` (reversibles: quitar sus 2 enlaces en `index.html`).
- [ ] Coherencia "Funciones" vs **"Herramientas"**: el tooltip del punto ya dice "Herramientas";
      decidir si renombrar también el enlace del nav y el título de la sección `#features`.
- [ ] **Optimizar fuentes** (self-host `.woff2`) para no depender de Google Fonts.
- [ ] Cuando exista build de **macOS/Linux**, activar sus botones de descarga (hoy *Próximamente*).
- [x] ~~Botones de **Descargar** del hero/precio~~ → **conectados** al release v0.2.1 (`screenpencil-releases`).
- [x] ~~Imagen Open Graph 1200×630 propia~~ → **hecha** (`og-banner.png`).

## Pendientes — Backend
- [ ] **Tests** unitarios para `getEvents` y `getTimeseries` (hoy solo `getSummary`; los endpoints ya funcionan).
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

## Repos
- Landing: `github.com/gepres/screenpencil-landing` → `https://gepres.github.io/screenpencil-landing/`
- Backend: `github.com/gepres/screenpencil-backend` → `https://screenpencil-backend.onrender.com`
- App (privado): `github.com/gepres/screenpencil-app`
- Releases (vitrina pública): `github.com/gepres/screenpencil-releases` → `/releases/latest`
