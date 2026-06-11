/* Primitivas de visualización reutilizables (dependency-free, devuelven HTML/SVG). */
import type { Bar } from "./types";
import { esc, num, pct, avg } from "./format";

/** Aviso para secciones que dependen de un endpoint aún no disponible. */
export function placeholder(msg: string): string {
  return `<div class="rounded-xl border border-dashed border-white/12 bg-white/[0.015] p-5 text-sm text-ink-dim">${msg}</div>`;
}

/** Lista de barras horizontales (top N + "Otros"). */
export function barList(items: Bar[], topN = 7): string {
  const rows = items.filter((i) => i.views > 0).sort((a, b) => b.views - a.views);
  if (!rows.length) return `<p class="text-sm text-ink-dim">Sin datos.</p>`;
  const total = rows.reduce((a, i) => a + i.views, 0) || 1;
  let list = rows;
  if (rows.length > topN) {
    const rest = rows.slice(topN);
    list = rows.slice(0, topN).concat([{ label: `Otros (${rest.length})`, views: rest.reduce((a, i) => a + i.views, 0) }]);
  }
  const max = Math.max(...list.map((i) => i.views), 1);
  return (
    `<ul class="space-y-2">` +
    list.map((i) => `
      <li class="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
        <span class="min-w-0 truncate text-ink-soft" title="${esc(i.label)}">${esc(i.label)}</span>
        <span class="tabular-nums text-ink">${num(i.views)} <span class="text-xs text-ink-dim">${pct(i.views, total)}%</span></span>
        <span class="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <span class="block h-full rounded-full bg-gradient-to-r from-amber to-cyan" style="width:${Math.round((i.views / max) * 100)}%"></span>
        </span>
      </li>`).join("") +
    `</ul>`
  );
}

/** Mini-gráfica de línea (SVG). */
export function sparkline(values: number[], color: string): string {
  if (values.length < 2) return "";
  const w = 120, h = 32, max = Math.max(...values, 1), min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`);
  return `<svg viewBox="0 0 ${w} ${h}" class="h-8 w-full" preserveAspectRatio="none">
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts.join(" ")}" />
  </svg>`;
}

/** Tendencia interna del periodo (último tercio vs primero), en %. */
export function trend(values: number[]): number | null {
  if (values.length < 4) return null;
  const k = Math.max(1, Math.floor(values.length / 3));
  const a = avg(values.slice(0, k)), b = avg(values.slice(-k));
  return a ? Math.round(((b - a) / a) * 100) : null;
}

/** Escala "bonita" para el eje Y (ticks redondeados). */
export function niceScale(max: number, ticks: number) {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const exp = Math.floor(Math.log10(max / Math.max(1, ticks)));
  const f = (max / Math.max(1, ticks)) / Math.pow(10, exp);
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * Math.pow(10, exp);
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + step * 0.001; v += step) out.push(Math.round(v));
  return { top, ticks: out };
}

/** Gráfico de columnas verticales. */
export function columns(items: { label: string; value: number }[], color = "#22d3ee"): string {
  if (!items.length || items.every((i) => i.value === 0)) return `<p class="text-sm text-ink-dim">Sin datos.</p>`;
  const max = Math.max(...items.map((i) => i.value), 1);
  return `<div class="flex items-end gap-1" style="height:120px">` +
    items.map((i) => {
      const a = i.value / max;
      return `<div class="flex flex-1 flex-col items-center justify-end gap-1" style="height:120px" title="${esc(i.label)}: ${num(i.value)}">
        <div class="w-full rounded-t" style="height:${Math.max(2, Math.round(a * 96))}px;background:${color};opacity:${(0.35 + 0.65 * a).toFixed(2)}"></div>
        <span class="text-[9px] text-ink-dim">${esc(i.label)}</span>
      </div>`;
    }).join("") + `</div>`;
}

export const DONUT_COLORS = ["#22d3ee", "#3b82f6", "#8b5cf6", "#e0a060", "#22c55e", "#ef4444", "#93a0bd"];

/** Donut (conic-gradient) con leyenda de porcentajes. */
export function donut(items: { name: string; count: number }[]): string {
  const rows = items.filter((i) => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  if (!rows.length) return `<p class="text-sm text-ink-dim">Sin datos.</p>`;
  const total = rows.reduce((a, i) => a + i.count, 0) || 1;
  let acc = 0;
  const stops = rows.map((r, i) => {
    const from = (acc / total) * 100; acc += r.count; const to = (acc / total) * 100;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from.toFixed(1)}% ${to.toFixed(1)}%`;
  }).join(", ");
  const legend = rows.map((r, i) =>
    `<li class="flex items-center justify-between gap-2 text-xs">
      <span class="inline-flex min-w-0 items-center gap-1.5"><i class="size-2 shrink-0 rounded-full" style="background:${DONUT_COLORS[i % DONUT_COLORS.length]}"></i><span class="truncate text-ink-soft" title="${esc(r.name)}">${esc(r.name)}</span></span>
      <span class="tabular-nums text-ink">${pct(r.count, total)}%</span>
    </li>`).join("");
  return `<div class="flex items-center gap-4">
    <div class="relative size-24 shrink-0 rounded-full" style="background:conic-gradient(${stops})">
      <div class="absolute inset-[24%] rounded-full bg-bg-1"></div>
    </div>
    <ul class="min-w-0 flex-1 space-y-1.5">${legend}</ul>
  </div>`;
}
