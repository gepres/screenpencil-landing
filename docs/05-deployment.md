# 05 — Despliegue

La landing es **estática**: no requiere build ni servidor de aplicación. Sube los archivos tal cual.

## Subir el repo a GitHub

```bash
cd screenpencil-landing
git init -b main
git add .
git commit -m "ScreenPencil landing: sitio bilingüe ES/EN"

# Repo remoto (créalo vacío en GitHub primero, sin README)
git remote add origin https://github.com/gepres/screenpencil-landing.git
git push -u origin main
```

> Atajo con la CLI de GitHub (crea el repo y sube en un paso):
> `gh repo create gepres/screenpencil-landing --public --source=. --push`

## Opciones de hosting

### GitHub Pages con GitHub Actions (recomendado, ya configurado)
El repo incluye `.github/workflows/deploy.yml`: en **cada push a `main`** publica el sitio en Pages.

1. Haz push a `main` (el workflow se dispara solo; también puedes lanzarlo desde la pestaña **Actions**).
2. La primera vez, el workflow intenta **activar Pages** automáticamente (`configure-pages` con `enablement: true`).
   Si fallara por permisos, ve una sola vez a **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
3. Tu sitio queda en `https://gepres.github.io/screenpencil-landing/` (la URL exacta sale en el log del job).

> Sube el repo **tal cual** (sin build). Como las rutas son **relativas** (`assets/...`), funciona aunque el sitio cuelgue de un subdirectorio.

### GitHub Pages desde rama (alternativa sin workflow)
Settings → Pages → Source: `Deploy from a branch` → `main` / `root`. Borra el workflow si usas esta vía.

### Netlify (gratis)
- Arrastra la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop), **o**
- Conecta el repo. **Build command:** *(vacío)*. **Publish directory:** `.` (raíz).

### Vercel (gratis)
- `vercel` en la carpeta, o importa el repo. Framework preset: **Other**. Sin build.

### Cloudflare Pages (gratis)
- Conecta el repo. Build command vacío. Output directory: `/`.

### Cualquier hosting / FTP
- Sube `index.html` + `assets/` (+ `docs/` si quieres publicarla). Listo.

## Dominio personalizado

Apunta tu dominio (p. ej. `screenpencil.app`) al hosting elegido:
- **GitHub Pages:** añade `CNAME` + registros DNS según su guía.
- **Netlify/Vercel/Cloudflare:** panel → *Domains* → seguir asistente (HTTPS automático).

## Antes de publicar (producción)

- [ ] Conecta los botones de **descarga** y **GitHub** (ver [04 — Desarrollo](04-development.md)).
- [ ] Reemplaza la imagen Open Graph (`assets/img/logo.png`) por una imagen social 1200×630 si quieres
      mejores previews al compartir.
- [ ] Ajusta `<title>` y `meta description` si cambia el posicionamiento.
- [ ] (Opcional) añade `robots.txt` y `sitemap.xml`.
- [ ] **Analítica:** pega el token de Cloudflare Web Analytics (ver sección siguiente).

## Analítica

Dos capas, ambas **sin cookies ni banner** de consentimiento (coherentes con el mensaje de privacidad)
e integradas en `index.html` antes de `</body>`.

### 1. Tráfico — Cloudflare Web Analytics (ya activo)
Mide visitas, páginas, fuentes y países.
- Cloudflare registra por **hostname** (dominio), no por subcarpeta: el sitio es **`gepres.github.io`**.
  En el panel, filtra por *Path* = `/screenpencil-landing/` para aislar esta landing.
- Para cambiar de cuenta, reemplaza el `token` del beacon en `index.html`.

### 2. Clics y flujo de usuario — GoatCounter
Mide **eventos** (la instrumentación está en `main.js`, función `track()` — un único punto de integración):

| Evento | `path` en el panel |
|--------|--------------------|
| Clic en Descargar (intención / botón real) | `cta/download-intent`, `download/<plataforma>` |
| Clic en GitHub | `github` |
| Clic en donación | `donate/<plataforma>` |
| Cambio de idioma | `lang/es`, `lang/en` |
| Uso de la demo (primer trazo) | `demo/used` |
| Showcase explorado | `showcase/<función>` |
| Flujo de scroll (hitos) | `flow/features`, `flow/demo`, `flow/pricing`, `flow/faq` |

Para activarlo:
1. Crea una cuenta gratis en [goatcounter.com](https://www.goatcounter.com) y elige un código (p. ej. `screenpencil`).
2. Reemplaza `TU_CODIGO` en el script de `index.html` por ese código → commit + push (el workflow redepliega).

> Mientras los placeholders (`TU_TOKEN`, `TU_CODIGO`) no se sustituyan, esa capa no registra (no rompe el sitio).
> **¿Prefieres GA4?** Da embudos/rutas más ricos pero usa cookies (requiere banner). Para migrar, reescribe
> solo el **cuerpo de `track()`** y cambia el snippet; la instrumentación de eventos no cambia.

## Rendimiento

Ya es ligero (0 KB de framework). Para exprimir:
- Sirve con **gzip/brotli** (los hosts anteriores lo hacen por defecto).
- Considera **self-host de fuentes** (`.woff2` en `assets/fonts/`) para evitar la latencia de Google Fonts.
- **Logo ya optimizado:** `logo.png` se redujo de 1024px (1.46 MB) a 160px (~8 KB) para mostrarse a 32-38px.
  El original de alta resolución se conserva como `logo-original.png` (usado solo en Open Graph / apple-touch-icon).
  Si cambias el logo, repite el proceso (ver `tools` o reusa el script de PowerShell del historial).

## Caché / actualizaciones

Al ser estático, basta con re-subir los archivos cambiados. Si usas CDN, purga la caché de
`index.html`, `styles.css` y `main.js` tras cada deploy.
