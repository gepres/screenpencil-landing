# 03 — Sistema de diseño

Todo el aspecto se controla con **tokens `@theme`** al inicio de `src/styles/global.css` (Tailwind v4).
Cambia ahí y se propaga a toda la página. La **paleta, los colores, los efectos y las animaciones de la
primera versión se conservan** (portados a Astro): fondo animado (mesh de gradientes + grid + blobs a la
deriva), ventana del hero con tilt 3D y flotación, float-cards, brillo que sigue al cursor en las
tarjetas y contadores animados. Lo único que **no** volvió es el *fullpage scroll* (ver abajo).

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

Cada sección es un componente `.astro` estilizado con Tailwind; los botones, tarjetas, pills, tabla de
atajos, etc. son utilidades de Tailwind. Solo unas pocas **clases CSS propias** (en `global.css`) llevan
los efectos de la v1 que no son utilidades:

| Clase propia | Qué es |
|--------------|--------|
| `.grad-text` | Texto con el gradiente de marca (azul→cian→ámbar). |
| `.bg` `.bg__grid` `.bg__blob--1/2/3` | Fondo animado (mesh + grid + blobs), en `Base.astro`. |
| `.hero-art` `.hero-window` `.float-card` | Mockup del hero con tilt 3D, flotación y badges flotantes. |
| `.glow-card` (`[data-glow]`) | Tarjeta de función con brillo que sigue al cursor (`--mx/--my`). |
| `.hero-scroll` | Indicador de scroll animado del hero. |
| `.reveal` | Aparición al hacer scroll (`IntersectionObserver`). |
| `<details>` (FAQ) | Acordeón nativo accesible. |

## Animaciones

Las animaciones de la primera versión se **conservan** (portadas a `src/styles/global.css` + `src/scripts/main.ts`).
Ver el detalle en **Animaciones (Astro)** más abajo.

| Animación | Dónde | Cómo |
|-----------|-------|------|
| **Blobs a la deriva** | Fondo (`.bg__blob--1/2/3`) | `@keyframes drift1/2/3`, `blur(64px)`. |
| **Grid con máscara** | Fondo (`.bg__grid`) | gradiente + `mask-image` radial. |
| **Ventana flotante + tilt** | Hero (`.hero-window`) | `@keyframes floaty` + `rotateX/Y` 3D, se endereza en hover. |
| **Float-cards** | Hero (`.float-card`) | `floaty` con `animation-delay` escalonado. |
| **Marquee** | Trust strip | scroll CSS, pausa en hover, estático en `reduced-motion`. |
| **Reveal al scroll** | `.reveal` | `IntersectionObserver` añade `.is-in`; `--reveal-delay` escalona. |
| **Contadores** | Hero métricas (`[data-metric]`) | `requestAnimationFrame` easeOutCubic (en `main.ts`). |
| **Brillo en cards** | `.glow-card::before` | `--mx/--my` actualizadas en `pointermove` (`[data-glow]`). |

## Accesibilidad

- **`prefers-reduced-motion`:** desactiva animaciones/transición y los contadores muestran el valor final.
- **Contraste:** texto principal sobre fondo oscuro cumple AA.
- **Foco:** navegación por teclado funcional; `<details>` y `<button>` nativos.
- **Semántica:** `header/nav/section/footer`, `aria-label` en landmarks, `alt` en imágenes.

## Responsive (breakpoints)

- `≤ 980px`: hero a una columna, features a 2 columnas, footer apilado.
- `≤ 760px`: menú hamburguesa, flujo/atajos/plataformas a 1 columna.
- `≤ 480px`: features a 1 columna, se ocultan las float-cards del hero.

## Fullpage scroll — retirado

El **fullpage scroll** (CSS Scroll Snap, cada sección a 100vh) de la versión vanilla se **eliminó** en
la migración a Astro: causaba recorte de las secciones largas (15 funciones, atajos, FAQ) en pantallas
bajas y reñía con el objetivo minimalista. Ahora es **scroll normal** con secciones que respiran
(`py-24`, anclas `id` por sección y `scroll-padding-top` para el nav fijo).
