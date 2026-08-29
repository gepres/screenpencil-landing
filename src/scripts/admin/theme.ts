/* Paleta del panel /admin.
 *
 * FUENTE DE VERDAD: el bloque <style> de `src/pages/admin.astro`. Aquí sólo se LEEN
 * esas variables CSS (con el valor actual como respaldo) para que los gráficos —que
 * se pintan desde JS, no desde clases— usen exactamente los mismos colores que el
 * resto del panel.
 *
 * Para recolorear el panel NO hay que tocar este archivo ni los gráficos: basta con
 * cambiar las variables en `admin.astro`.
 */

const cssVar = (name: string, fallback: string): string => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};

/** Acento del panel: el mismo token que usan las clases `amber` de Tailwind. */
export const accent = cssVar("--color-amber", "#e0a060");

/** Ejes y etiquetas de los gráficos. */
export const axis = cssVar("--color-ink-dim", "#5e6a86");

/** Fondo del mapa de visitantes. */
export const mapBg = cssVar("--admin-map-bg", "#0a0f1e");

/** Serie de colores del panel, en orden de reparto. */
export const chart = [
  cssVar("--admin-chart-1", "#22d3ee"), // cian
  cssVar("--admin-chart-2", "#3b82f6"), // azul
  cssVar("--admin-chart-3", "#60a5fa"), // azul claro
  cssVar("--admin-chart-4", "#8b5cf6"), // violeta
  cssVar("--admin-chart-5", "#22c55e"), // verde
  cssVar("--admin-chart-6", "#ef4444"), // rojo
  cssVar("--admin-chart-7", "#93a0bd"), // gris
];

/** Colores con papel fijo (cada fuente de datos mantiene su color en todo el panel). */
export const series = {
  goatcounter: chart[0],
  cloudflare: chart[1],
  visits: chart[2],
};

/** Color por familia de evento en "Acciones en el tiempo". */
export const eventColor = {
  download: chart[4],
  donate: chart[3],
  demo: chart[0],
  nav: chart[1],
  other: accent,
};

/** Paleta de los donuts (dispositivos, navegadores…). */
export const DONUT_COLORS = [chart[0], chart[1], chart[3], accent, chart[4], chart[5], chart[6]];
