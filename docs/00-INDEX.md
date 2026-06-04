# 00 — Índice de documentación · Landing de ScreenPencil

Bienvenido a la documentación de la **landing page de ScreenPencil**. Aquí encontrarás
el porqué, el qué y el cómo del sitio. Mantén estos documentos **concisos y actualizados**.

## Mapa

| Doc | Para qué |
|-----|----------|
| [01 — Visión y alcance](01-overview.md) | Qué es ScreenPencil, a quién sirve la landing y sus objetivos. |
| [02 — Estructura de contenido](02-content-structure.md) | Cada sección de la página, su mensaje y su orden. |
| [03 — Sistema de diseño](03-design-system.md) | Paleta, tipografías, espaciado, componentes y animaciones. |
| [04 — Desarrollo](04-development.md) | Cómo correr, editar y extender el código (vanilla, sin build). |
| [05 — Despliegue](05-deployment.md) | Publicar en GitHub Pages, Netlify, Vercel, etc. |

## Principios

1. **Cero fricción.** Sitio estático: doble clic o cualquier servidor. Sin `npm install` obligatorio.
2. **Rápido y accesible.** 0 KB de framework, lazy reveal, respeta `prefers-reduced-motion`.
3. **Fiel al producto.** Las funciones y atajos mostrados reflejan la app real (ver repo `screenbrush-windown`).
4. **Mensaje central.** *Gratis, sin trucos, para todos* — Windows, macOS y Linux.
5. **Bilingüe ES/EN.** Español por defecto (público LATAM / España) + inglés vía `data-en`, con conmutador en el nav que autodetecta y recuerda el idioma.

## Glosario rápido

- **Overlay:** capa transparente a pantalla completa donde se dibuja.
- **Modo dibujo / reposo:** activado/desactivado por un atajo global; en reposo es *click-through*.
- **Spotlight, freeze, pizarra, lupa:** modos especiales de la app (ver landing y app docs).

## Fuente de verdad del producto

La especificación completa de la app está en el repositorio hermano **`screenbrush-windown/docs/`**.
Esta landing solo comunica; si una función cambia allí, actualiza [02 — Estructura de contenido](02-content-structure.md).
