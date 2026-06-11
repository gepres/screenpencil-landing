# 02 — Estructura de contenido

Orden de las secciones en `src/pages/index.astro` (un componente Astro por sección), su mensaje y de
dónde sale el copy. Si una función de la app cambia, actualiza aquí y en el componente correspondiente.

## Orden de la página

| # | Sección | `id` | Mensaje clave |
|---|---------|------|---------------|
| 1 | **Nav** | `#nav` | Marca + navegación + **conmutador ES/EN** + CTA "Descargar" siempre visible. |
| 2 | **Hero** | `#hero` | *Dibuja sobre toda tu pantalla, gratis.* Ventana flotante con captura real + CTAs + métricas. |
| 3 | **Trust strip** | `#trust` | Marquee: sin cuentas, sin marca de agua, multi-monitor, open source… |
| 4 | **Funciones** | `#features` | 15 tarjetas con las herramientas reales de la app. |
| 5 | **Showcase interactivo** | `#showcase` | Pestañas que cambian capturas reales por función (con lightbox). |
| 6 | **Cómo funciona** | `#flow` | Flujo en 4 pasos: bandeja → activar → anotar → capturar. |
| 7 | **Demo** | `#demo` | Mini-pizarra interactiva en canvas (probar la sensación). |
| 8 | **Atajos** | `#hotkeys` | Tabla de atajos globales / herramientas / edición. |
| 9 | **Plataformas** | `#platforms` | Windows (disponible), macOS y Linux (próximamente). |
| 10 | **Precio** | `#download` | $0 para siempre + lista de incluido + CTAs de descarga. |
| 11 | **Donaciones** | `#donate` | Apoyo opcional: Buy Me a Coffee, Ko-fi, GitHub Sponsors, PayPal. |
| 12 | **FAQ** | `#faq` | 7 preguntas frecuentes (acordeón `<details>`). |
| 13 | **En camino** | `#roadmap` | Roadmap "próximamente" (6 ítems). |
| 14 | **CTA final** | — | Repite la llamada a descargar. |
| 15 | **Footer** | — | Enlaces, plataformas, recursos (incl. Donar), copyright. |

> **Donaciones:** la app es y seguirá siendo gratis; las donaciones son **opcionales** y se presentan
> sin presión ("usar y compartir también apoya"). Hay un botón "Donar" en el nav y enlace en el footer.

## Funciones mostradas (sección 4)

Reflejan la app real (repo `screenbrush-windown`, fases 1–7):

- Lápiz y marcador (presión de stylus) · Figuras y flechas (editables) · Texto y badges
- Spotlight · Lupa con zoom · Pizarra · Freeze
- Multi-monitor (HiDPI/4K) · Captura y copia (PNG / portapapeles)
- Color y grosor (paleta + HSV + opacidad) · Deshacer/rehacer · Atajos globales reasignables

> Mantener honesto: lo que esté solo "en camino" en la app no debe presentarse como disponible.
> macOS/Linux van marcados explícitamente como **Próximamente**.

## Atajos mostrados (sección 7)

Tomados de `screenbrush-windown/docs/11-hotkeys-and-input.md` (valores por defecto):

- **Globales:** `Ctrl+Alt+D` (modo dibujo), `+S` (captura), `+X` (copiar), `+W` (pizarra), `+L` (spotlight), `+F` (freeze).
- **Herramientas:** `P` `H` `A` `L` `R` `O` `T` `E`.
- **Edición:** `Ctrl+Z` / `Ctrl+Y`, `↑/↓` grosor, `1…6` color, `Tab` última herramienta, `Esc` salir.

## CTAs y conversión

- **Primario:** "Descargar gratis" → ancla `#download` (y botón con `data-download`).
- **Secundario:** "Probar en el navegador" → ancla `#demo`.
- **Terciario:** "Ver en GitHub" (`data-github`).

Los botones `data-download` / `data-github` muestran un aviso *placeholder* hasta conectar las URLs
reales (ver [04 — Desarrollo](04-development.md)).

## Tono y estilo del copy

- **Cercano y directo**, en español neutro LATAM/España.
- Frases cortas. Verbos de acción ("dibuja", "resalta", "captura").
- Enfatiza **gratis / sin trucos / para todos**.
- Evita jerga técnica en el hero; los detalles técnicos van en FAQ y atajos.

> **Bilingüe ES/EN:** cada texto se escribe en ambos idiomas con `<T es="…" en="…" />`. El inglés debe
> sonar igual de natural y conciso (no traducción literal). Si añades o cambias copy, actualiza **ambos**.
> Mecánica del conmutador: ver [04 — Desarrollo](04-development.md#cambiar-textos-bilingüe-esen).
