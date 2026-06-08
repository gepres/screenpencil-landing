# NEXT-STEPS — Mejoras pendientes (próxima sesión)

Estado y pendientes del **ecosistema ScreenPencil** (landing + backend + app). Actualizar al cerrar
cada sesión. Última actualización: **2026-06-08**.

## Estado actual (hecho)
- **Landing** (`screenpencil-landing`, GitHub Pages): bilingüe ES/EN, hero con captura real, showcase
  con pestañas, donaciones conectadas (PayPal/Coffee/GitHub Sponsors), capturas en WebP, analítica
  (Cloudflare + GoatCounter), **panel `/admin`** conectado al backend, **fullpage scroll** (CSS snap).
- **Backend** (`screenpencil-backend`, NestJS + Neon + Prisma): **desplegado en Render**
  (`https://screenpencil-backend.onrender.com`). Endpoints `/health`, `/analytics/summary|events|timeseries`
  con API key, agregación GoatCounter + Cloudflare y caché en Postgres. `partial:false` con datos reales.
- **App de escritorio** (`screenbrush-windown`): bienvenida en primera ejecución (toolbar + guía).

## Pendientes — Landing
- [ ] **Validar el fullpage scroll** en distintas alturas de pantalla. Secciones largas (12
      funciones, atajos 3 columnas, FAQ) pueden no caber en 100vh → revisar recorte / contenido bajo el nav.
  - Ajustes posibles: `scroll-padding-top` para el nav; `mandatory` → `proximity` si se siente brusco;
    reducir contenido por panel (menos funciones/atajos por pantalla).
  - Archivos: `assets/css/fullpage.css`, `assets/js/fullpage.js` (reversibles: quitar sus 2 enlaces en `index.html`).
- [ ] Coherencia "Funciones" vs **"Herramientas"**: el tooltip del punto ya dice "Herramientas";
      decidir si renombrar también el enlace del nav y el título de la sección `#features`.
- [ ] Botones de **Descargar** del hero/precio siguen como placeholder (conectar al instalador/release real).
- [ ] **Optimizar fuentes** (self-host `.woff2`) para no depender de Google Fonts.
- [ ] (Opc.) Imagen Open Graph 1200×630 propia (hoy usa `logo-original.png`).

## Pendientes — Backend
- [ ] **Tests** unitarios para `getEvents` y `getTimeseries` (hoy solo `getSummary`).
- [ ] **`DATABASE_URL` directa** (sin `-pooler`) en Render para futuras migraciones (evitar locks de PgBouncer).
- [ ] **Mantener "caliente"** el free tier de Render (cron de ping) para evitar cold start ~50 s.
- [ ] **F4 — Auth real** del `/admin` (JWT o Cloudflare Access) en vez de API key en el navegador.
- [ ] Warning de `pg`/`sslmode=require`: dejar explícito (`sslmode=verify-full` o `uselibpqcompat=true`).

## Pendientes — App de escritorio
- [ ] Confirmación **multi-pantalla** del usuario.
- [ ] **Instalador + firma** (ver `screenbrush-windown/docs/12`).
- [ ] Resto de Fase 7 (badges, snapshots/PDF, ghost mode, cursor halo…).

## Repos
- Landing: `github.com/gepres/screenpencil-landing` → `https://gepres.github.io/screenpencil-landing/`
- Backend: `github.com/gepres/screenpencil-backend` → `https://screenpencil-backend.onrender.com`
- App: `github.com/gepres/screenpencil-app` (codename interno `ScreenBrush`)
