# ScreenPencil — Landing page

Sitio web de presentación de **ScreenPencil**, la app gratuita para **dibujar y anotar sobre toda tu pantalla** (Windows · macOS · Linux).

**🌐 Sitio en vivo:** <https://gepres.github.io/screenpencil-landing/>

> **Stack:** HTML + CSS + JavaScript **vanilla**. Sin framework, sin build, sin dependencias.
> Se abre con doble clic en `index.html`. Despliega en cualquier hosting estático.
>
> **Bilingüe 🇪🇸 / 🇬🇧** — español por defecto e inglés con un conmutador en el nav (autodetecta el idioma del navegador y recuerda la elección).

---

## ✨ Qué incluye

- **Bilingüe ES/EN** sin recargar: el español vive en el DOM y el inglés en atributos `data-en`; un botón en el nav alterna y persiste la preferencia (`localStorage`).
- **Hero** con una ventana flotante que muestra una captura real del producto.
- **Fondo dinámico** (mesh de gradientes + grid + blobs en movimiento).
- **Grid de funciones** (15 tarjetas) con efecto de brillo que sigue al cursor.
- **Showcase interactivo**: pestañas que cambian capturas reales de cada función (anotar, figuras, texto/badges, spotlight, lupa, pizarra) + lightbox para ampliar.
- **Sección "Cómo funciona"** (flujo en 4 pasos).
- **Demo interactiva**: una mini-pizarra real en `<canvas>` (lápiz, marcador, borrador, colores, grosor).
- **Tabla de atajos** de teclado, **sección multiplataforma**, **bloque de precio** ($0, sin paywall), **donaciones** y **FAQ** acordeón.
- **Roadmap** ("próximamente") con lo que viene.
- **Analítica privacy-first** (Cloudflare Web Analytics, sin cookies) y **deploy automático** a GitHub Pages (Actions).
- **100% responsive** y con soporte de `prefers-reduced-motion` (accesibilidad).

---

## 🚀 Cómo verlo en local

### Opción A — doble clic (lo más simple)
Abre `index.html` en tu navegador. Funciona sin servidor.

### Opción B — servidor local (recomendado para desarrollo)
Cualquiera de estos sirve la carpeta en `http://localhost:8000`:

```bash
# Python 3
python -m http.server 8000

# Node (npx, sin instalar nada permanente)
npx serve .

# PHP
php -S localhost:8000
```

> Algunas APIs (p. ej. `canvas.toDataURL` al redimensionar) van mejor servidas por HTTP que con `file://`.

---

## 📁 Estructura

```
screenpencil-landing/
├── index.html              # Página única (secciones + copy ES/data-en + beacon de analítica)
├── README.md
├── LICENSE                 # MIT
├── .gitignore
├── .gitattributes          # normaliza finales de línea (LF)
├── .github/workflows/
│   └── deploy.yml          # publica en GitHub Pages vía Actions (en cada push a main)
├── assets/
│   ├── css/styles.css      # Estilos + animaciones (tokens de diseño en :root)
│   ├── js/main.js          # Interacciones, i18n ES/EN, reveal, contadores, showcase, demo
│   └── img/
│       ├── favicon.svg
│       ├── logo-white.png            # Logo blanco que usa la web (fondo oscuro)
│       ├── logo.png                  # Logo a color (variante / Open Graph)
│       ├── logo-original.png         # Original 1024px (apple-touch-icon / OG)
│       ├── screenpincel-logo-blanco.png  # Original blanco 1024px (fuente)
│       ├── hero-shot.png             # Captura del hero + showcase "anotar"
│       └── fn-*.png                  # Capturas del showcase (figuras, texto, spotlight, lupa, pizarra)
└── docs/                   # Documentación del proyecto (ver docs/00-INDEX.md)
```

---

## 🌍 Idiomas (i18n)

No hay framework: el sistema bilingüe es ~30 líneas en `main.js`.

- El **español** es el texto por defecto en el HTML.
- El **inglés** va en un atributo `data-en` sobre el mismo elemento. Si el texto lleva markup, va **escapado** dentro del atributo:

  ```html
  <h2 data-en="What's coming &lt;span class='grad-text'&gt;next&lt;/span&gt;">
    Lo que viene <span class="grad-text">próximamente</span>
  </h2>
  ```

- Regla de oro: pon `data-en` solo en **elementos hoja** (sin otro `data-en` anidado dentro), o el intercambio dejaría nodos huérfanos.
- El botón `#langToggle` del nav alterna; `applyLang()` actualiza `<title>`, `meta description`, `<html lang>` y guarda la preferencia en `localStorage`. La primera visita autodetecta con `navigator.language`.

Para **añadir un texto traducible**: escribe el español en el elemento y añade su `data-en`. Listo.

---

## 🎨 Personalización rápida

Casi todo el aspecto vive en **variables CSS** al inicio de `assets/css/styles.css`:

```css
:root {
  --bg-0: #060912;     /* fondo principal      */
  --blue: #3b82f6;     /* azul de marca        */
  --cyan: #22d3ee;     /* cian (acentos)       */
  --amber: #e0a060;    /* ámbar del logo       */
  /* ... */
}
```

- **Textos:** edita `index.html` (español en el elemento, inglés en `data-en` — ver sección Idiomas).
- **Enlaces de descarga / GitHub / donación:** busca `data-download`, `data-github` y `data-donate` en
  `index.html` y reemplázalos por las URLs reales (ver `docs/04-development.md`).

---

## 🐙 Subir a un repositorio (GitHub) y publicar

El sitio es **estático** y las rutas son **relativas**, así que funciona tal cual desde un subdirectorio
(ideal para GitHub Pages de proyecto).

### 1. Inicializa y haz el primer commit

```bash
cd screenpencil-landing
git init -b main
git add .
git commit -m "ScreenPencil landing: sitio bilingüe ES/EN"
```

### 2. Conecta el repo remoto y sube

```bash
# Crea el repo vacío en GitHub primero (sin README, para no chocar), p. ej. gepres/screenpencil-landing
git remote add origin https://github.com/gepres/screenpencil-landing.git
git push -u origin main
```

> Con la CLI de GitHub puedes crear y subir en un paso:
> `gh repo create gepres/screenpencil-landing --public --source=. --push`

### 3. Publica en GitHub Pages (ya automatizado)

El repo trae `.github/workflows/deploy.yml`: **cada push a `main` publica el sitio** en Pages.
La primera vez activa Pages automáticamente; si fallara por permisos, ve una sola vez a
**Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
El sitio queda en `https://gepres.github.io/screenpencil-landing/`.

Otros hostings (Netlify, Vercel, Cloudflare Pages) o el deploy desde rama: ver **`docs/05-deployment.md`**.

---

## 📊 Analítica (sin cookies)

Dos capas, ambas sin cookies ni banner de consentimiento:

- **Tráfico — Cloudflare Web Analytics** (ya activo): visitas, páginas, fuentes y países.
- **Clics y flujo — GoatCounter**: eventos de descarga, GitHub, donación, idioma, demo, showcase y
  profundidad de scroll. La instrumentación vive en `main.js` (función `track()`, un único punto de
  integración); se activa pegando tu código en `TU_CODIGO` (`index.html`).

Pasos detallados, tabla de eventos y cómo migrar a GA4: **`docs/05-deployment.md`**.

---

## 📚 Documentación

Toda la documentación del proyecto está en [`docs/`](docs/00-INDEX.md):

| Doc | Contenido |
|-----|-----------|
| [00 — Índice](docs/00-INDEX.md) | Mapa de la documentación |
| [01 — Visión](docs/01-overview.md) | Qué es y a quién sirve |
| [02 — Estructura de contenido](docs/02-content-structure.md) | Secciones y copy |
| [03 — Sistema de diseño](docs/03-design-system.md) | Colores, tipografías, animaciones |
| [04 — Desarrollo](docs/04-development.md) | Cómo trabajar el código (incl. i18n) |
| [05 — Despliegue](docs/05-deployment.md) | Publicar el sitio (git + hosting) |

---

## 🔗 Enlaces del proyecto

- **🌐 Sitio en vivo:** <https://gepres.github.io/screenpencil-landing/>
- **📦 Repo de esta landing:** <https://github.com/gepres/screenpencil-landing>
- **🖥️ Repo de la app de escritorio:** <https://github.com/gepres/screenpencil-app>

La app de escritorio (codename interno `ScreenBrush`, nombre público **ScreenPencil**) vive en su
**propio repositorio**; esta landing es solo el sitio de marketing.

## 📝 Licencia

Publicado bajo licencia **MIT** — ver [`LICENSE`](LICENSE).
