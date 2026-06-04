# 03 — Sistema de diseño

Todo el aspecto se controla con **variables CSS** en `:root` (inicio de `assets/css/styles.css`).
Cambia ahí y se propaga a toda la página.

## Paleta

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-0` | `#060912` | Fondo principal (casi negro azulado). |
| `--bg-1` / `--bg-2` | `#0a0e1c` / `#0f1424` | Superficies oscuras. |
| `--surface` | `rgba(255,255,255,.04)` | Tarjetas (glass). |
| `--border` | `rgba(255,255,255,.08)` | Bordes sutiles. |
| `--text` | `#e8edf7` | Texto principal. |
| `--text-muted` | `#93a0bd` | Texto secundario. |
| `--blue` | `#3b82f6` | Azul de marca. |
| `--cyan` | `#22d3ee` | Cian (acentos, eyebrows). |
| `--amber` | `#e0a060` | Ámbar del **logo** (pincel) — acento cálido. |
| `--violet` | `#8b5cf6` | Blob de fondo. |

**Gradiente de marca:** `--grad` = azul → cian → ámbar. Se usa en titulares (`.grad-text`),
botones primarios y números del flujo.

## Tipografías

- **Display / titulares:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (500–700).
- **Texto:** [Inter](https://fonts.google.com/specimen/Inter) (400–600).
- Cargadas desde Google Fonts en `<head>`. Fallback: `system-ui`.

> Si quieres self-host (sin depender de Google), descarga los `.woff2` a `assets/fonts/`
> y reemplaza el `<link>` por `@font-face`.

## Escala y radios

- Ancho máximo de contenido: `--maxw: 1180px`.
- Radios: `--r-sm` 10px · `--r-md` 16px · `--r-lg` 24px · `--r-xl` 34px.
- Easing global: `--ease: cubic-bezier(.22,1,.36,1)`.

## Componentes

| Clase | Qué es |
|-------|--------|
| `.btn` `.btn--primary` `.btn--ghost` `.btn--sm/--lg` | Botones (primario con barrido de brillo). |
| `.pill` `.badge` `.eyebrow` | Etiquetas pequeñas. |
| `.card` | Tarjeta de función (brillo que sigue al cursor vía `--mx/--my`). |
| `.flow__step` `.flow__num` | Pasos del flujo. |
| `.keys__col` `kbd` `.combo` | Tabla de atajos. |
| `.platcard` | Tarjeta de plataforma. |
| `.faq__item` (`<details>`) | Acordeón nativo accesible. |
| `.window` + `.ink` | Mockup del hero con animación de trazo SVG. |

## Animaciones

| Animación | Dónde | Cómo |
|-----------|-------|------|
| **Blobs a la deriva** | Fondo (`.bg__blob`) | `@keyframes drift1/2/3`, blur. |
| **Grid con máscara** | Fondo (`.bg__grid`) | gradiente + `mask-image` radial. |
| **Trazo que se dibuja** | Hero (`.ink__draw`) | `stroke-dasharray/offset` + `@keyframes draw`. |
| **Mockup flotante + tilt** | Hero (`.window`) | `@keyframes floaty` + `transform` 3D en hover. |
| **Marquee** | Trust strip | `@keyframes marquee`, pausa en hover. |
| **Reveal al scroll** | `.reveal` | `IntersectionObserver` añade `.is-visible`. `--d` escalona. |
| **Contadores** | Hero métricas | `requestAnimationFrame` easeOutCubic (en `main.js`). |
| **Brillo en cards** | `.card::before` | `--mx/--my` actualizadas en `pointermove`. |

## Accesibilidad

- **`prefers-reduced-motion`:** desactiva animaciones/transición y los contadores muestran el valor final.
- **Contraste:** texto principal sobre fondo oscuro cumple AA.
- **Foco:** navegación por teclado funcional; `<details>` y `<button>` nativos.
- **Semántica:** `header/nav/section/footer`, `aria-label` en landmarks, `alt` en imágenes.

## Responsive (breakpoints)

- `≤ 980px`: hero a una columna, features a 2 columnas, footer apilado.
- `≤ 760px`: menú hamburguesa, flujo/atajos/plataformas a 1 columna.
- `≤ 480px`: features a 1 columna, se ocultan las float-cards del hero.
