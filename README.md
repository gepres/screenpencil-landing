# ScreenPencil — Landing

Sitio de presentación de **ScreenPencil**, la app gratuita para **dibujar y anotar sobre toda tu
pantalla** (Windows · macOS · Linux). Diseño minimalista, **calmado y componetizado**.

**🌐 Sitio en vivo:** <https://gepres.github.io/screenpencil-landing/>

> **Stack:** [Astro](https://astro.build) 5 + [Tailwind CSS](https://tailwindcss.com) v4.
> Estático, **~0 JS** salvo las islas que lo necesitan (demo canvas, showcase, toggle i18n).
> **Bilingüe ES/EN** sin recargar y sin parpadeo (idioma inactivo oculto por CSS).

## Migración desde la versión vanilla

Esta landing nació como un `index.html` monolítico (HTML/CSS/JS vanilla, sin build) y se **migró a
Astro** para mejorarla. El minimalismo está en el **diseño** (calma, espacio, un solo acento, sin
fondo ruidoso ni fullpage forzado), **no en recortar contenido**: está todo.

| Antes (vanilla) | Ahora (Astro) |
|---|---|
| Fullpage scroll forzado (no cabía en algunas pantallas) | scroll normal, secciones que respiran |
| Fondo con mesh + grid + blobs en movimiento | un único glow ambiental sutil |
| Brillo que sigue al cursor en 15 tarjetas | grid calmado (las 15 funciones intactas) |
| `data-en` escapado en el HTML | componente `<T es en />` + CSS (soporta markup) |
| Un `index.html` de 689 líneas | componentes Astro reutilizables |
| 2.7 MB de PNG sin usar en el repo | solo se conservan los assets necesarios |
| Deploy: subir la raíz tal cual | Deploy: build de Astro en GitHub Actions |

**Contenido completo:** hero (con métricas), tira de confianza (8 sellos), 15 funciones, showcase
(6 capturas), 4 pasos, demo canvas, tabla de atajos (20), 3 plataformas, precio/descarga,
donaciones, FAQ (7) y roadmap (6).

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # genera dist/
pnpm preview    # sirve dist/ en local
```

## Estructura

```
src/
├── layouts/Base.astro        # <head> (SEO, OG, JSON-LD, fuentes), glow, script i18n pre-render
├── components/
│   ├── T.astro               # texto bilingüe (es/en) sin parpadeo
│   ├── Icon.astro            # iconos SVG inline
│   ├── SectionHead.astro     # encabezado de sección (eyebrow + título + sub)
│   ├── Nav.astro  Hero.astro  Features.astro  Showcase.astro
│   ├── Steps.astro  Demo.astro  Download.astro  Donate.astro  Faq.astro  Footer.astro
├── pages/
│   ├── index.astro           # landing
│   └── admin.astro           # panel de analítica (noindex, aislado: usa assets/css|js propios)
├── scripts/main.ts           # reveal on scroll · toggle i18n · analítica · badge de versión
├── data/site.ts              # versión, URLs de descarga/donación, API del backend
└── styles/global.css         # Tailwind v4 + tokens de marca (@theme)
public/assets/                # imágenes WebP, logos, favicon, OG; CSS/JS del /admin heredado
```

## i18n

Cada texto se escribe en los dos idiomas y el CSS oculta el inactivo según `data-lang` en `<html>`:

```astro
<T es="Descargar gratis" en="Download free" />
<T es="Dibuja sobre <span class='grad-text'>tu pantalla</span>" en="Draw over <span class='grad-text'>your screen</span>" />
```

El idioma se detecta del navegador en la primera visita, se aplica **antes del primer pintado**
(sin flash) y se recuerda en `localStorage`. El botón del nav lo alterna.

## Personalización

- **Colores / tipografía:** tokens `@theme` al inicio de `src/styles/global.css`.
- **Enlaces y versión:** `src/data/site.ts` (descarga, GitHub, donaciones, API de analítica).
- **Textos:** en cada componente con `<T es en />`.

## Despliegue

Sitio **estático**: cualquier hosting sirve `dist/`.

- **GitHub Pages:** `.github/workflows/deploy.yml` publica en cada push a `main` y fija el `base`
  automáticamente al nombre del repo (Pages de proyecto).
- **Vercel / Cloudflare Pages / dominio propio (raíz):** deja `BASE_PATH=/` (valor por defecto).
- `SITE_URL` y `BASE_PATH` son variables de entorno leídas en `astro.config.mjs`.

## Analítica (sin cookies)

Mismo modelo que la v1: GoatCounter (eventos) + Cloudflare (tráfico). La instrumentación vive en
`src/scripts/main.ts` (`track()`, único punto de integración). El panel **`/admin`** consume el
backend NestJS (`screenpencil-backend`).

## Licencia

MIT.
