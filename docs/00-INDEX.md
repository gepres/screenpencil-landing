# 00 — Índice de documentación · Landing de ScreenPencil

Bienvenido a la documentación de la **landing page de ScreenPencil**. Aquí encontrarás
el porqué, el qué y el cómo del sitio. Mantén estos documentos **concisos y actualizados**.

> **Stack:** Astro 5 + Tailwind v4 (migrado desde HTML/CSS/JS vanilla). Ver [README](../README.md) y [04 — Desarrollo](04-development.md).

## Mapa

| Doc | Para qué |
|-----|----------|
| [01 — Visión y alcance](01-overview.md) | Qué es ScreenPencil, a quién sirve la landing y sus objetivos. |
| [02 — Estructura de contenido](02-content-structure.md) | Cada sección de la página, su mensaje y su orden. |
| [03 — Sistema de diseño](03-design-system.md) | Paleta, tipografías, espaciado, componentes y animaciones. |
| [04 — Desarrollo](04-development.md) | Cómo correr, editar y extender el código (Astro + Tailwind). |
| [05 — Despliegue](05-deployment.md) | Build de Astro y publicación en GitHub Pages (Actions), Vercel, etc. |
| [06 — Panel admin (analytics)](06-admin-dashboard.md) | El `/admin` que consume el backend NestJS (GoatCounter + Cloudflare). |
| [NEXT-STEPS](NEXT-STEPS.md) | **Mejoras pendientes** y notas para la próxima sesión. |

## Principios

1. **Rápido y accesible.** Astro envía ~0 JS salvo las islas necesarias; lazy reveal; respeta `prefers-reduced-motion`.
2. **Componetizado.** Una sección por componente Astro; copy y enlaces centralizados (`<T>`, `src/data/site.ts`).
3. **Fiel al producto.** Las funciones y atajos mostrados reflejan la app real (ver repo `screenbrush-windown`).
4. **Mensaje central.** *Gratis, sin trucos, para todos* — Windows, macOS y Linux.
5. **Bilingüe ES/EN.** Español por defecto (público LATAM / España) + inglés con el componente `<T es en />` y un conmutador en el nav que autodetecta y recuerda el idioma.
6. **Minimalista en el diseño, completo en el contenido.** Calma visual (sin fondo ruidoso ni fullpage forzado) sin recortar datos.

## Glosario rápido

- **Overlay:** capa transparente a pantalla completa donde se dibuja.
- **Modo dibujo / reposo:** activado/desactivado por un atajo global; en reposo es *click-through*.
- **Spotlight, freeze, pizarra, lupa:** modos especiales de la app (ver landing y app docs).

## Fuente de verdad del producto

La especificación completa de la app está en el repositorio hermano **`screenbrush-windown/docs/`**.
Esta landing solo comunica; si una función cambia allí, actualiza [02 — Estructura de contenido](02-content-structure.md).
