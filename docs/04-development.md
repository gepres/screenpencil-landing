# 04 — Desarrollo

Cómo trabajar el código de la landing. Desde la migración, el stack es **Astro 5 + Tailwind CSS v4**
(antes era HTML/CSS/JS vanilla sin build).

## Correr en local

```bash
pnpm install      # primera vez
pnpm dev          # → http://localhost:4321 (hot reload)
pnpm build        # genera dist/
pnpm preview      # sirve dist/ como en producción
```

> Requiere Node ≥ 20 y pnpm 10. El sitio es **estático** (output `static`): `dist/` se publica tal cual.

## Mapa de archivos

| Ruta | Responsabilidad |
|------|-----------------|
| `src/pages/index.astro` | Ensambla las secciones de la landing en orden. |
| `src/pages/admin.astro` | Panel de analítica (`/admin`), **aislado**: usa su CSS/JS heredado en `public/assets`. |
| `src/layouts/Base.astro` | `<head>` (SEO, OG, JSON-LD, fuentes), glow ambiental, script i18n pre-render. |
| `src/components/*.astro` | Una sección por componente: `Nav`, `Hero`, `Trust`, `Features`, `Showcase`, `Steps`, `Demo`, `Shortcuts`, `Platforms`, `Download`, `Donate`, `Faq`, `Roadmap`, `Footer`. |
| `src/components/T.astro` | Texto bilingüe `<T es="…" en="…" />` (soporta HTML inline). |
| `src/components/Icon.astro` | Iconos SVG inline (sin dependencias). |
| `src/components/SectionHead.astro` | Encabezado de sección (eyebrow + título + subtítulo). |
| `src/scripts/main.ts` | reveal on scroll · toggle de idioma · analítica (`track()`) · badge de versión. |
| `src/data/site.ts` | **Único punto de verdad**: versión, URLs de descarga/GitHub/donación, API del backend. |
| `src/styles/global.css` | Tailwind v4 + tokens de marca (`@theme`) + utilidades (`grad-text`, `ambient`, `reveal`, i18n). |
| `public/assets/img/` | Imágenes WebP, logos, favicon, banner OG. |
| `public/assets/{css,js}/` | CSS/JS del `/admin` heredado (no se usan en el sitio de marketing). |

## Tareas frecuentes

### Cambiar textos (bilingüe ES/EN)
Edita el componente de la sección. Cada texto usa `<T>`:

```astro
<T es="Descargar gratis" en="Download free" />
<T es="Dibuja sobre <span class='grad-text'>tu pantalla</span>"
   en="Draw over <span class='grad-text'>your screen</span>" />
```

`T` renderiza **ambos idiomas** como hermanos; el CSS (`[data-lang]` en `<html>`) oculta el inactivo
→ soporta markup sin parpadeo y sin nodos huérfanos (a diferencia del viejo `data-en`). El toggle
del nav (`[data-lang-toggle]`) y `setLang()` en `main.ts` actualizan `<title>`/`meta description`,
guardan en `localStorage` y autodetectan el idioma en la primera visita.

### Cambiar colores / fuentes
Edita los tokens `@theme` al inicio de `src/styles/global.css` (ver [03 — Sistema de diseño](03-design-system.md)).

### Añadir una función a la grid
Añade un objeto al array `cards` en `src/components/Features.astro` (`{ ic, es, en, dEs, dEn }`).
El escalonado del reveal se calcula solo.

### Conectar descarga / GitHub / donaciones / versión
Todo vive en `src/data/site.ts` (no hay que tocar el markup):

```ts
export const site = {
  version: "v0.2.1",
  downloadWindows: "https://github.com/gepres/screenpencil-releases/releases/download/v0.2.1/…exe",
  releasesRepo: "https://github.com/gepres/screenpencil-releases",
  coffee: "…", sponsors: "…", paypal: "…",
  analyticsApi: "https://screenpencil-backend.onrender.com",
};
```

Al sacar versión nueva, actualiza `version` y `downloadWindows`. El badge además consulta
`releases/latest` de la API de GitHub en `main.ts` y sobreescribe el tag si responde.

### Cambiar las capturas del showcase
El mapeo pestaña → imagen es el array `tabs` en `src/components/Showcase.astro`
(`{ id, ic, img, title, es, en, … }`). Genera las capturas con la **propia app** (`Ctrl+Alt+S`,
salen limpias) y déjalas en `public/assets/img/` reusando los nombres (`hero-shot.webp`, `fn-*.webp`).

### Tocar la demo de canvas
Lógica en el `<script>` de `src/components/Demo.astro`: herramientas (`pen`/`marker`/`eraser`),
colores, grosor y limpiar. El lienzo se reescala a HiDPI conservando el dibujo.

### Configurar el panel `/admin`
`src/pages/admin.astro` consume el backend NestJS; la URL y la API key se ponen en el ⚙ (se guardan
en `localStorage`). Ver [06 — Panel admin](06-admin-dashboard.md).

## Convenciones

- **Comentarios en español**; copy con `<T es en />`; identificadores TS/CSS en inglés.
- Mantener **~0 JS** en el sitio de marketing: solo islas necesarias (demo, showcase, toggle, reveal).
- Respetar `prefers-reduced-motion` en cualquier animación nueva.
- Mobile-first: probar a `375px`, `768px`, `1280px`.

## Checklist antes de publicar

- [ ] `pnpm build` sin errores ni warnings.
- [ ] El conmutador **ES/EN** cambia todos los textos y los recuerda al recargar.
- [ ] Reveal funciona al hacer scroll; la demo dibuja con ratón **y** táctil.
- [ ] Menú hamburguesa abre/cierra en móvil.
- [ ] Enlaces de descarga/GitHub/donación correctos (revisar `src/data/site.ts`).
- [ ] `<title>`, `meta description`, canonical y Open Graph correctos.
- [ ] Lighthouse: Performance / Accesibilidad / SEO en verde.
