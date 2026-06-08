# 04 — Desarrollo

Cómo trabajar el código de la landing. **No hay build ni dependencias**: es HTML + CSS + JS vanilla.

## Correr en local

```bash
# Opción 1: doble clic en index.html (funciona sin servidor)

# Opción 2: servidor estático (recomendado, evita restricciones de file://)
python -m http.server 8000      # → http://localhost:8000
npx serve .                     # alternativa con Node
php -S localhost:8000           # alternativa con PHP
```

> Algunas APIs (p. ej. `canvas.toDataURL` al redimensionar) funcionan mejor servidas por HTTP
> que abriendo `file://`. Para desarrollo, usa un servidor local.

## Mapa de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `index.html` | Estructura y **todo el copy** (una sola página). Español en el elemento, inglés en `data-en`. |
| `assets/css/styles.css` | Estilos, tokens en `:root`, animaciones, responsive. |
| `assets/js/main.js` | **i18n ES/EN**, nav, reveal, contadores, brillo de cards, **showcase**, **demo de canvas**, avisos. |
| `assets/img/logo-white.png` | Logo del pincel (blanco, el que usa la web). |
| `assets/img/hero-shot.png`, `fn-*.png` | Capturas reales del hero y del showcase. |
| `assets/img/favicon.svg` | Favicon. |

## Tareas frecuentes

### Cambiar textos (bilingüe ES/EN)
Edita `index.html` directamente. Está organizado por secciones con comentarios `<!-- ===== SECCIÓN ===== -->`.

- El **español** es el texto visible en el elemento.
- El **inglés** va en el atributo `data-en` del mismo elemento. Si lleva markup, escápalo:
  `data-en="Draw over &lt;span class='grad-text'&gt;your screen&lt;/span&gt;"`.
- Pon `data-en` solo en **elementos hoja** (sin otro `data-en` anidado), o el swap deja nodos huérfanos.

El conmutador `#langToggle` y `applyLang()` (en `main.js`) hacen el resto: alternan, actualizan
`<title>`/`meta description`/`<html lang>`, guardan la preferencia en `localStorage` y autodetectan
el idioma del navegador en la primera visita.

### Cambiar colores / fuentes
Edita las variables en `:root` de `styles.css` (ver [03 — Sistema de diseño](03-design-system.md)).

### Añadir una función a la grid
Duplica un `<article class="card reveal" style="--d:N">…</article>` en `#features` e incrementa `--d`
(controla el escalonado del reveal).

### Conectar la descarga real
Busca en `index.html` los atributos:

```html
<a href="#" class="btn btn--primary btn--lg" data-download="windows"> … </a>
<a href="#" data-github> … </a>
```

1. Sustituye `href="#"` por la URL real (release de GitHub, instalador, etc.).
2. **Mantén** el atributo `data-download` / `data-github`: el handler de `main.js` detecta que ya hay
   URL real (`href` distinto de `#`), **registra el evento** en analítica y **deja navegar/descargar**;
   solo muestra el aviso *placeholder* cuando el `href` sigue siendo `#`.

> Estado actual: `main.js` consulta `releases/latest` por la API de GitHub y apunta el botón
> "Descargar para Windows" al `.exe` de la última versión automáticamente; el `index.html` mantiene un
> *fallback* estático (hoy `…/releases/download/v0.2.0/ScreenPencil-Setup-0.2.0.exe`) por si la API falla.
> Al sacar una versión nueva, actualiza ese fallback (tag e instalador) en `index.html`.

### Cambiar las capturas del showcase interactivo (`#showcase`)
El showcase tiene pestañas (`.sc-tab[data-sc]`) que cambian una imagen (`#scImg`) y un lightbox al hacer clic.
El mapeo pestaña → imagen vive en el objeto `SC` del bloque *"SHOWCASE INTERACTIVO"* de `main.js`:

```js
const SC = {
  anotar:    { img: 'assets/img/hero-shot.png',    title: '…', alt: '…' },
  figuras:   { img: 'assets/img/fn-figuras.png',   title: '…', alt: '…' },
  // texto, spotlight, lupa, pizarra…
};
```

Para refrescarlas:
1. Genera las capturas con la **propia app**: dibuja sobre algo real y pulsa `Ctrl+Alt+S`
   (salen limpias, con las anotaciones, sin marca de agua).
2. Copia los PNG a `assets/img/` reusando los nombres (`hero-shot.png`, `fn-figuras.png`, `fn-texto.png`,
   `fn-spotlight.png`, `fn-lupa.png`, `fn-pizarra.png`) o ajusta los `img` del objeto `SC`.
3. ¿Otra pestaña? Añade un `<button class="sc-tab" data-sc="clave">…</button>` en `#showcase` y su
   entrada en `SC`. Recuerda el `data-en` del texto de la pestaña.

> Formato recomendado: PNG/WebP, proporción ~16:10, ≥ 1600 px de ancho.

### Conectar los enlaces de donación
En la sección `#donate` hay 4 botones con `href="#"` y `data-donate="..."`:

```html
<a href="#" class="donate__btn donate__btn--coffee" data-donate="coffee"> … </a>
<a href="#" class="donate__btn donate__btn--kofi"   data-donate="kofi">   … </a>
<a href="#" class="donate__btn donate__btn--gh"     data-donate="github"> … </a>
<a href="#" class="donate__btn donate__btn--paypal" data-donate="paypal"> … </a>
```

Para activarlos:
1. Pon tu URL real en `href` (ej. `https://buymeacoffee.com/tuusuario`).
2. Quita el atributo `data-donate` para que el clic **abra el enlace** en vez del aviso *placeholder*
   (el handler está en `main.js`). Añade `target="_blank" rel="noopener"` si quieres abrir en pestaña nueva.
3. ¿No usas alguna plataforma? Borra ese `<a>` — la grid se reacomoda sola.

El botón **"Donar"** del nav y el enlace del footer apuntan al ancla `#donate`.

### Activar / revertir el fullpage scroll
El efecto vive en `assets/css/fullpage.css` + `assets/js/fullpage.js`, enlazados en `index.html`.
- **Revertir:** elimina (o comenta) esas 2 líneas en `index.html` → vuelve a scroll normal.
- **Ajustar paneles:** edita el selector de `id` en **ambos** archivos para que coincidan.
- **Snap más suave:** en `fullpage.css`, `scroll-snap-type: y mandatory` → `… proximity`.
- **Etiquetas de los puntos:** objeto `LABELS` en `fullpage.js`.
- Solo en `≥ 900px` y sin `prefers-reduced-motion`. Ver [03 — Sistema de diseño](03-design-system.md).

### Configurar el panel `/admin`
`admin.html` consume el backend NestJS; la URL del backend y la API key se ponen en el ⚙ (se guardan
en `localStorage`). Por defecto apunta a producción (Render). Ver [06 — Panel admin](06-admin-dashboard.md).

### Tocar la demo de canvas
La lógica está en `main.js`, bloque *"DEMO DE DIBUJO EN CANVAS"*. Herramientas (`pen`/`marker`/`eraser`),
colores (`.swatch[data-color]`), grosor (`#demoSize`) y limpiar (`#demoClear`). El lienzo se reescala
a HiDPI conservando el dibujo.

## Convenciones

- **Comentarios en español**; copy en español en el elemento + traducción en `data-en`; identificadores JS/CSS en inglés (coherente con el repo de la app).
- Mantener **0 dependencias**. Si algo "necesita" una librería, evaluar si se puede con CSS/JS nativo.
- Respetar `prefers-reduced-motion` en cualquier animación nueva.
- Mobile-first razonable: probar a `375px`, `768px`, `1280px`.

## Checklist antes de publicar

- [ ] Abre sin errores en consola (F12).
- [ ] El conmutador **ES/EN** cambia todos los textos y los recuerda al recargar (sin nodos huérfanos).
- [ ] Reveal y contadores funcionan al hacer scroll.
- [ ] La demo dibuja con ratón **y** con dedo (touch).
- [ ] Menú hamburguesa abre/cierra en móvil.
- [ ] Enlaces de descarga/GitHub apuntan a destinos reales (o avisan claramente).
- [ ] `<title>`, `meta description` y Open Graph correctos.
- [ ] Lighthouse: Performance / Accesibilidad / SEO en verde.
