/* Funciones de render: reciben datos de la API y pintan cada sección del panel.
   Sin estado global ni fetch — solo leen el DOM (vía $) y devuelven/inyectan HTML. */
import type {
  ActionSeries, Devices, EventItem, Events, GeoJson, Provider, Summary, Timeseries, VitalMetric, Vitals,
} from "./types";
import { $, esc, fmtShort, flag, num, pct } from "./format";
import { barList, columns, donut, niceScale, placeholder, sparkline, trend } from "./charts";

// --- KPIs (con sparkline + tendencia) ---
export function renderKpis(s: Summary, ts: Timeseries | null) {
  const el = $("[data-kpis]");
  if (!el) return;
  const gcViews = s.goatcounter?.totals.pageviews ?? 0;
  const cfViews = s.cloudflare?.totals.pageviews ?? 0;
  const cfVisits = s.cloudflare?.totals.visits ?? 0;
  const gcSeries = (ts?.goatcounter ?? []).map((p) => p.views);
  const cfSeries = (ts?.cloudflare ?? []).map((p) => p.views);
  const visitsSeries = (ts?.cloudflare ?? []).map((p) => p.visits ?? 0);

  const cards = [
    { k: "GoatCounter", v: gcViews, s: "páginas vistas", series: gcSeries, color: "#22d3ee" },
    { k: "Cloudflare", v: cfViews, s: "páginas vistas", series: cfSeries, color: "#3b82f6" },
    { k: "Cloudflare", v: cfVisits, s: "visitas", series: visitsSeries, color: "#60a5fa" },
  ];

  el.innerHTML = cards.map((c) => {
    const t = trend(c.series);
    const tHtml = t === null ? "" :
      `<span class="text-xs font-semibold ${t >= 0 ? "text-emerald-400" : "text-red-400"}">${t >= 0 ? "▲" : "▼"} ${Math.abs(t)}%</span>`;
    return `
      <article class="rounded-2xl border border-white/8 bg-bg-1 p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-ink-dim">${esc(c.k)}</span>${tHtml}
        </div>
        <div class="mt-1 font-display text-2xl font-bold tabular-nums text-ink">${num(c.v)}</div>
        <div class="text-xs text-ink-dim">${esc(c.s)}</div>
        <div class="mt-2">${sparkline(c.series, c.color)}</div>
      </article>`;
  }).join("");
}

// --- Gráfica de área (GC vs CF) con tooltip ---
export function renderChart(ts: Timeseries | null) {
  const el = $("[data-chart]");
  const legend = $("[data-chart-legend]");
  if (!el || !legend) return;
  const series = [
    { name: "GoatCounter", color: "#22d3ee", data: ts?.goatcounter ?? [] },
    { name: "Cloudflare", color: "#3b82f6", data: ts?.cloudflare ?? [] },
  ].filter((s) => s.data.length);

  const dates = [...new Set(series.flatMap((s) => s.data.map((p) => p.date)))].sort();
  if (!dates.length) { el.innerHTML = `<p class="text-sm text-ink-dim">Sin serie en este periodo.</p>`; legend.innerHTML = ""; return; }
  const maps = series.map((s) => new Map(s.data.map((p) => [p.date, p.views])));
  const rawMax = Math.max(1, ...series.flatMap((s) => s.data.map((p) => p.views)));

  const W = 680, H = 240, padL = 40, padR = 12, padT = 12, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const ns = niceScale(rawMax, 4);
  const x = (i: number) => dates.length === 1 ? padL + plotW / 2 : padL + (i * plotW) / (dates.length - 1);
  const y = (v: number) => padT + plotH * (1 - v / ns.top);
  const step = dates.length > 1 ? plotW / (dates.length - 1) : plotW;

  const grid = ns.ticks.map((t) => {
    const yy = y(t).toFixed(1);
    return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="rgba(255,255,255,0.06)"/>
      <text x="${padL - 6}" y="${yy}" text-anchor="end" dominant-baseline="middle" fill="#5e6a86" font-size="10">${fmtShort(t)}</text>`;
  }).join("");

  const dots = dates.length <= 31;
  const baseY = (padT + plotH).toFixed(1);
  const body = series.map((s, si) => {
    const pts = dates.map((d, i) => `${x(i).toFixed(1)},${y(maps[si].get(d) || 0).toFixed(1)}`);
    const area = `M ${x(0).toFixed(1)},${baseY} L ${pts.join(" L ")} L ${x(dates.length - 1).toFixed(1)},${baseY} Z`;
    const dd = dots ? dates.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(maps[si].get(d) || 0).toFixed(1)}" r="2.4" fill="${s.color}"/>`).join("") : "";
    return `<path d="${area}" fill="${s.color}" opacity="0.12"/>
      <polyline fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" points="${pts.join(" ")}"/>${dd}`;
  }).join("");

  const nX = Math.min(dates.length, 6);
  const xIdx = dates.length === 1 ? [0] : Array.from({ length: nX }, (_, k) => Math.round((k * (dates.length - 1)) / (nX - 1)));
  const xlabels = [...new Set(xIdx)].map((i) => {
    const anchor = i === 0 ? "start" : i === dates.length - 1 ? "end" : "middle";
    return `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}" fill="#5e6a86" font-size="10">${esc(dates[i].slice(5))}</text>`;
  }).join("");

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="w-full" role="img" aria-label="Tendencia diaria">
    ${grid}${body}${xlabels}
    <line data-guide x1="0" y1="${padT}" x2="0" y2="${padT + plotH}" stroke="rgba(255,255,255,0.25)" style="display:none"/>
  </svg><div data-tip class="pointer-events-none absolute hidden rounded-lg border border-white/12 bg-bg-2 px-2.5 py-1.5 text-xs shadow-lg"></div>`;
  (el as HTMLElement).style.position = "relative";

  legend.innerHTML = series.map((s) => `<span class="inline-flex items-center gap-1.5"><i class="size-2 rounded-full" style="background:${s.color}"></i>${s.name}</span>`).join("") +
    `<span class="text-ink-dim">máx/día: ${num(rawMax)}</span>`;

  const svg = el.querySelector("svg");
  const tip = el.querySelector<HTMLElement>("[data-tip]");
  const guide = el.querySelector<SVGLineElement>("[data-guide]");
  if (svg && tip && guide) {
    svg.addEventListener("mousemove", (ev) => {
      const r = svg.getBoundingClientRect();
      let i = Math.round((((ev.clientX - r.left) / r.width) * W - padL) / step);
      i = Math.max(0, Math.min(dates.length - 1, i));
      const gx = x(i);
      guide.setAttribute("x1", String(gx)); guide.setAttribute("x2", String(gx)); guide.style.display = "";
      tip.innerHTML = `<b>${esc(dates[i])}</b>` + series.map((s, si) =>
        `<div class="flex items-center gap-1.5"><i class="size-2 rounded-full" style="background:${s.color}"></i>${esc(s.name)}: <b>${num(maps[si].get(dates[i]) || 0)}</b></div>`).join("");
      tip.style.display = "block";
      tip.style.left = Math.min(r.width - 120, Math.max(0, (gx / W) * r.width)) + "px";
      tip.style.top = "0px";
    });
    svg.addEventListener("mouseleave", () => { tip.style.display = "none"; guide.style.display = "none"; });
  }
}

// --- Funnel de conversión ---
function sumEvents(events: EventItem[], prefix: string): number {
  return events.filter((e) => e.name === prefix || e.name.startsWith(prefix + "/")).reduce((a, e) => a + e.count, 0);
}
export function renderFunnel(s: Summary, ev: Events | null) {
  const el = $("[data-funnel]");
  if (!el) return;
  const events = ev?.events ?? [];
  const visits = s.cloudflare?.totals.visits || s.cloudflare?.totals.pageviews || s.goatcounter?.totals.pageviews || 0;
  const stages = [
    { label: "Visitas", v: visits },
    { label: "Probó la demo", v: sumEvents(events, "demo") },
    { label: "Exploró showcase", v: sumEvents(events, "showcase") },
    { label: "Clic en descargar", v: sumEvents(events, "download") },
  ];
  const top = stages[0].v || 1;
  el.innerHTML = stages.map((st, i) => {
    const wRel = Math.max(2, Math.round((st.v / top) * 100));
    const prev = i === 0 ? null : stages[i - 1].v;
    const conv = prev ? pct(st.v, prev) : 100;
    return `
      <div class="mb-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-ink-soft">${esc(st.label)}</span>
          <span class="tabular-nums text-ink">${num(st.v)} ${i > 0 ? `<span class="text-xs ${conv >= 30 ? "text-emerald-400" : "text-ink-dim"}">${conv}%</span>` : ""}</span>
        </div>
        <div class="mt-1 h-7 overflow-hidden rounded-lg bg-white/5">
          <div class="flex h-full items-center rounded-lg bg-gradient-to-r from-amber/80 to-cyan/70" style="width:${wRel}%"></div>
        </div>
      </div>`;
  }).join("") + `<p class="mt-2 text-xs text-ink-dim">Visitas = Cloudflare · pasos = eventos GoatCounter.</p>`;
}

// --- Comparación GoatCounter vs Cloudflare ---
function providerCard(name: string, icon: string, p: Provider | null): string {
  if (!p) return `<article class="rounded-2xl border border-white/8 bg-bg-1 p-5"><h3 class="font-display font-semibold">${icon} ${name}</h3><p class="mt-2 text-sm text-ink-dim">Sin respuesta / no configurado.</p></article>`;
  return `<article class="rounded-2xl border border-white/8 bg-bg-1 p-5">
    <h3 class="font-display font-semibold">${icon} ${name}</h3>
    <div class="mt-3 flex gap-6">
      <div><div class="font-display text-xl font-bold tabular-nums text-ink">${num(p.totals.pageviews)}</div><div class="text-xs text-ink-dim">páginas vistas</div></div>
      <div><div class="font-display text-xl font-bold tabular-nums text-ink">${num(p.totals.visits)}</div><div class="text-xs text-ink-dim">visitas</div></div>
    </div>
    <h4 class="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Top páginas</h4>
    ${barList(p.topPages.map((x) => ({ label: x.path, views: x.views })), 5)}
  </article>`;
}
export function renderCompare(s: Summary) {
  const el = $("[data-compare]");
  if (!el) return;
  el.innerHTML = providerCard("GoatCounter", "📊", s.goatcounter) + providerCard("Cloudflare", "🌐", s.cloudflare);
}

// --- Países / Fuentes (prefiere Cloudflare, cae a GoatCounter) ---
export function renderGeo(s: Summary) {
  const src = s.cloudflare ?? s.goatcounter;
  // Para países prefiere la fuente con código ISO (GoatCounter) → permite banderas.
  const countrySrc = s.goatcounter?.countries?.length ? s.goatcounter : src;
  const cEl = $("[data-countries]"), rEl = $("[data-referrers]");
  if (cEl) cEl.innerHTML = barList((countrySrc?.countries ?? []).map((c) => ({ label: flag(c.code) + (c.name || c.code || "?"), views: c.views })));
  if (rEl) rEl.innerHTML = barList((src?.referrers ?? []).map((r) => ({ label: r.host || "(directo)", views: r.views })));
}

// --- Mapa mundial (GeoJSON desde CDN + proyección equirectangular) ---
let worldGeo: GeoJson | null = null;
// Nombres del GeoJSON que difieren de los de Cloudflare/GoatCounter (geo → analítica).
const GEO_ALIAS: Record<string, string> = {
  "united states of america": "united states",
  "republic of serbia": "serbia",
  "czech republic": "czechia",
  "united republic of tanzania": "tanzania",
  "the bahamas": "bahamas",
  "republic of korea": "south korea",
  "russian federation": "russia",
};
export async function renderMap(s: Summary) {
  const el = $("[data-map]");
  if (!el) return;
  // MISMA fuente que las barras de países: GoatCounter primero (es lo que se ve arriba).
  const src = s.goatcounter?.countries?.length ? s.goatcounter : s.cloudflare;
  const countries = src?.countries ?? [];
  if (!countries.length) { el.innerHTML = placeholder("Sin datos de países en este periodo."); return; }
  const norm = (x: string) => x.toLowerCase().trim();
  const total = countries.reduce((a, c) => a + c.views, 0) || 1;
  // Info por país (rank, %, código para la bandera), indexada por nombre normalizado.
  const info = new Map<string, { name: string; views: number; code?: string; share: number; rank: number }>();
  let max = 1;
  [...countries].sort((a, b) => b.views - a.views).forEach((c, i) => {
    if (c.name) {
      info.set(norm(c.name), { name: c.name, views: c.views, code: c.code, share: pct(c.views, total), rank: i + 1 });
      max = Math.max(max, c.views);
    }
  });

  el.innerHTML = `<p class="text-sm text-ink-dim">Cargando mapa…</p>`;
  try {
    if (!worldGeo) {
      // Geometría desde el mismo origen (public/assets) — no depende de CDN ni de adblockers.
      const r = await fetch(`${import.meta.env.BASE_URL}assets/world.geo.json`);
      if (!r.ok) throw new Error("geojson HTTP " + r.status);
      worldGeo = (await r.json()) as GeoJson;
    }

    const W = 760, H = 380;
    const px = (lon: number) => ((lon + 180) / 360) * W;
    const py = (lat: number) => ((90 - lat) / 180) * H;
    const ring = (r: number[][]) => "M" + r.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join("L") + "Z";

    let matched = 0;
    const paths = (worldGeo.features ?? []).map((f) => {
      const gname = f.properties?.name ?? "";
      const nm = norm(gname);
      const data = info.get(nm) ?? info.get(GEO_ALIAS[nm] ?? "\0");
      const v = data?.views ?? 0;
      if (v > 0) matched++;
      const a = v / max;
      const fill = v > 0 ? `rgba(34,211,238,${(0.4 + a * 0.6).toFixed(2)})` : "rgba(255,255,255,0.07)";
      const g = f.geometry;
      let d = "";
      if (g?.type === "Polygon") d = (g.coordinates as number[][][]).map(ring).join("");
      else if (g?.type === "MultiPolygon") d = (g.coordinates as number[][][][]).map((poly) => poly.map(ring).join("")).join("");
      if (!d) return "";
      // Datos para el tooltip (en data-*; el handler los lee al pasar el cursor).
      const meta = data ? `${num(v)} páginas vistas · ${data.share}% del total · #${data.rank}` : "Sin datos en este periodo";
      const fl = data?.code ? flag(data.code) : "";
      return `<path d="${d}" fill="${fill}" stroke="rgba(255,255,255,0.12)" stroke-width="0.3" class="cursor-pointer hover:brightness-150" data-n="${esc(data?.name ?? gname)}" data-f="${fl}" data-meta="${esc(meta)}"></path>`;
    }).join("");

    el.innerHTML = `<div data-map-wrap class="relative overflow-hidden rounded-xl bg-[#0a0f1e]">
      <svg viewBox="0 0 ${W} ${H}" class="w-full">${paths}</svg>
      <div data-map-tip class="pointer-events-none absolute z-10 hidden max-w-[200px] rounded-lg border border-white/12 bg-bg-2/95 px-3 py-2 text-xs shadow-lg backdrop-blur"></div>
    </div>
    <p class="mt-2 text-xs text-ink-dim">${matched} de ${countries.length} países con datos coloreados · pasa el cursor por un país.</p>`;

    // Tooltip interactivo: muestra país + datos al pasar sobre cada path.
    const wrap = el.querySelector<HTMLElement>("[data-map-wrap]");
    const svg = wrap?.querySelector("svg");
    const tip = wrap?.querySelector<HTMLElement>("[data-map-tip]");
    if (wrap && svg && tip) {
      let lastN = "";
      svg.addEventListener("mousemove", (ev) => {
        const t = ev.target as HTMLElement;
        if (t?.tagName === "path" && t.dataset.n) {
          if (t.dataset.n !== lastN) {
            lastN = t.dataset.n;
            tip.innerHTML = `<div class="font-semibold text-ink">${t.dataset.f || ""}${esc(t.dataset.n)}</div><div class="mt-0.5 text-ink-soft">${esc(t.dataset.meta || "")}</div>`;
          }
          tip.style.display = "block";
          const r = wrap.getBoundingClientRect();
          const x = Math.min(ev.clientX - r.left + 12, r.width - tip.offsetWidth - 8);
          const y = Math.min(ev.clientY - r.top + 12, r.height - tip.offsetHeight - 8);
          tip.style.left = Math.max(4, x) + "px";
          tip.style.top = Math.max(4, y) + "px";
        } else {
          tip.style.display = "none";
          lastN = "";
        }
      });
      svg.addEventListener("mouseleave", () => { tip.style.display = "none"; lastN = ""; });
    }
  } catch (err) {
    el.innerHTML = placeholder("No se pudo dibujar el mapa: " + esc(err instanceof Error ? err.message : "error") + ". Las barras de países de arriba siguen disponibles.");
  }
}

// --- Acciones agrupadas por categoría ---
const GROUPS: { title: string; match: (n: string) => boolean }[] = [
  { title: "⬇️ Descargas", match: (n) => n.startsWith("download") },
  { title: "💜 Donaciones", match: (n) => n.startsWith("donate") },
  { title: "✨ Engagement", match: (n) => n.startsWith("demo") || n.startsWith("showcase") || n === "github" },
  { title: "🧭 Navegación", match: (n) => n.startsWith("section") || n.startsWith("scroll") },
  { title: "🌐 Idioma", match: (n) => n.startsWith("lang") },
];
export function renderEvents(ev: Events | null) {
  const el = $("[data-events]");
  if (!el) return;
  const events = ev?.events ?? [];
  if (!events.length) { el.innerHTML = `<p class="text-sm text-ink-dim">Sin eventos en este periodo. Cuando los usuarios naveguen, descarguen o prueben la demo, aparecerán aquí.</p>`; return; }
  const used = new Set<string>();
  const cards = GROUPS.map((g) => {
    const items = events.filter((e) => g.match(e.name));
    items.forEach((e) => used.add(e.name));
    if (!items.length) return "";
    return `<div class="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <h3 class="mb-3 text-sm font-semibold text-ink">${g.title}</h3>
      ${barList(items.map((e) => ({ label: e.name.split("/").slice(1).join("/") || e.name, views: e.count })), 6)}
    </div>`;
  });
  const others = events.filter((e) => !used.has(e.name));
  if (others.length) cards.push(`<div class="rounded-xl border border-white/8 bg-white/[0.02] p-4"><h3 class="mb-3 text-sm font-semibold text-ink">📦 Otros</h3>${barList(others.map((e) => ({ label: e.name, views: e.count })), 6)}</div>`);
  el.innerHTML = cards.filter(Boolean).join("");
}

// --- Dispositivos (donuts + tamaño de pantalla) ---
export function renderDevices(d: Devices | null) {
  const el = $("[data-devices]");
  if (!el) return;
  if (!d) { el.innerHTML = placeholder("Requiere el endpoint <code class='text-ink-soft'>/panel/devices</code> en el backend (navegador · SO · tamaño de pantalla). Pendiente de desplegar."); return; }
  el.innerHTML = `<div class="grid gap-5 sm:grid-cols-2">
    <div><h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-dim">Navegador</h4>${donut(d.browsers)}</div>
    <div><h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-dim">Sistema</h4>${donut(d.systems)}</div>
    <div class="sm:col-span-2"><h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Tamaño de pantalla</h4>${barList(d.sizes.map((x) => ({ label: x.name, views: x.count })), 5)}</div>
  </div>`;
}

// --- Heatmap día × hora ---
export function renderHeatmap(ts: Timeseries | null) {
  const el = $("[data-heatmap]");
  if (!el) return;
  const days = (ts?.goatcounter ?? []).filter((p) => Array.isArray(p.hourly) && p.hourly!.length === 24);
  if (!days.length) { el.innerHTML = placeholder("Requiere el campo <code class='text-ink-soft'>hourly</code> en <code class='text-ink-soft'>/panel/timeseries</code> (GoatCounter ya lo envía; el backend lo colapsa a diario). Pendiente de exponer."); return; }
  const max = Math.max(1, ...days.flatMap((d) => d.hourly!));
  const cell = (v: number) => {
    const a = v / max;
    return `<td class="p-0"><div class="size-3.5 rounded-[3px]" style="background:rgba(34,211,238,${(0.08 + a * 0.92).toFixed(3)})" title="${num(v)}"></div></td>`;
  };
  const rows = days.slice(-14).map((d) =>
    `<tr><td class="pr-2 text-right text-[10px] text-ink-dim">${esc(d.date.slice(5))}</td>${d.hourly!.map(cell).join("")}</tr>`).join("");
  el.innerHTML = `<div class="overflow-x-auto"><table class="border-separate border-spacing-1"><tbody>${rows}</tbody>
    <tfoot><tr><td></td>${Array.from({ length: 24 }, (_, h) => `<td class="text-center text-[9px] text-ink-dim">${h % 6 === 0 ? h : ""}</td>`).join("")}</tr></tfoot></table></div>
    <p class="mt-2 text-xs text-ink-dim">Páginas vistas por hora (últimos ${Math.min(days.length, 14)} días). Más claro = más tráfico.</p>`;
}

// --- Patrones de tiempo (hora del día + día de la semana) ---
export function renderTimePatterns(ts: Timeseries | null) {
  const gc = ts?.goatcounter ?? [];
  const hourEl = $("[data-hourdist]");
  if (hourEl) {
    const days = gc.filter((p) => Array.isArray(p.hourly) && p.hourly!.length === 24);
    if (!days.length) hourEl.innerHTML = placeholder("Requiere el campo <code class='text-ink-soft'>hourly</code> del backend.");
    else {
      const byHour = Array.from({ length: 24 }, (_, h) => days.reduce((acc, d) => acc + (d.hourly![h] || 0), 0));
      hourEl.innerHTML = columns(byHour.map((v, h) => ({ label: h % 3 === 0 ? String(h) : "", value: v }))) +
        `<p class="mt-2 text-xs text-ink-dim">Suma del periodo (GoatCounter). Pico = horas de más tráfico.</p>`;
    }
  }
  const wdEl = $("[data-weekday]");
  if (wdEl) {
    const src = gc.length ? gc : (ts?.cloudflare ?? []);
    if (!src.length) wdEl.innerHTML = placeholder("Sin serie temporal en este periodo.");
    else {
      const acc = [0, 0, 0, 0, 0, 0, 0];
      for (const p of src) {
        const d = new Date(p.date + "T00:00:00");
        if (!isNaN(d.getTime())) acc[d.getDay()] += p.views;
      }
      const order = [1, 2, 3, 4, 5, 6, 0];
      const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      wdEl.innerHTML = columns(order.map((wd, i) => ({ label: labels[i], value: acc[wd] })), "#3b82f6") +
        `<p class="mt-2 text-xs text-ink-dim">Páginas vistas acumuladas por día de la semana.</p>`;
    }
  }
}

// --- Profundidad de lectura (eventos scroll/25·50·75·100) ---
export function renderReadDepth(ev: Events | null) {
  const el = $("[data-readdepth]");
  if (!el) return;
  const events = ev?.events ?? [];
  const get = (m: number) => events.find((e) => e.name === `scroll/${m}`)?.count ?? 0;
  const marks = [25, 50, 75, 100].map((m) => ({ m, v: get(m) }));
  const top = Math.max(marks[0].v, 1);
  if (marks.every((x) => x.v === 0)) {
    el.innerHTML = placeholder("Aún sin datos de scroll. Se registran <code class='text-ink-soft'>scroll/25·50·75·100</code> a medida que los visitantes bajan por la página.");
    return;
  }
  el.innerHTML = marks.map((x, i) => {
    const w = Math.max(2, Math.round((x.v / top) * 100));
    const ret = i === 0 ? 100 : pct(x.v, marks[0].v);
    return `<div class="mb-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-ink-soft">Bajó ≥ ${x.m}%</span>
        <span class="tabular-nums text-ink">${num(x.v)} <span class="text-xs ${ret >= 50 ? "text-emerald-400" : "text-ink-dim"}">${ret}%</span></span>
      </div>
      <div class="mt-1 h-6 overflow-hidden rounded-lg bg-white/5"><div class="h-full rounded-lg bg-gradient-to-r from-cyan/70 to-blue-bright/70" style="width:${w}%"></div></div>
    </div>`;
  }).join("") + `<p class="mt-2 text-xs text-ink-dim">% relativo a quienes empezaron a bajar (scroll 25%).</p>`;
}

// --- Rendimiento / Web Vitals (Cloudflare RUM) ---
function vitalCard(label: string, m: VitalMetric | null, goodMs: number, poorMs: number): string {
  if (!m) return `<div class="rounded-xl border border-white/8 bg-white/[0.02] p-4"><div class="text-xs text-ink-dim">${label}</div><div class="mt-1 text-ink-dim">—</div></div>`;
  const v = m.p75;
  const color = v <= goodMs ? "text-emerald-400" : v <= poorMs ? "text-amber" : "text-red-400";
  const s = (ms: number) => (ms >= 1000 ? (ms / 1000).toFixed(2) + " s" : Math.round(ms) + " ms");
  return `<div class="rounded-xl border border-white/8 bg-white/[0.02] p-4">
    <div class="text-xs text-ink-dim">${label} <span class="opacity-60">(p75)</span></div>
    <div class="mt-1 font-display text-2xl font-bold ${color}">${s(v)}</div>
    <div class="text-xs text-ink-dim">mediana ${s(m.p50)}</div>
  </div>`;
}
export function renderVitals(v: Vitals | null) {
  const el = $("[data-vitals]");
  if (!el) return;
  if (!v || (!v.fcp && !v.loadTime)) {
    el.innerHTML = placeholder("Requiere el endpoint <code class='text-ink-soft'>/panel/vitals</code> (Cloudflare RUM). Si está desplegado y sigue vacío, puede que los nombres de campo del GraphQL difieran — revisar el log de Render.");
    return;
  }
  el.innerHTML = `<div class="grid gap-3 sm:grid-cols-2">
    ${vitalCard("First Contentful Paint", v.fcp, 1800, 3000)}
    ${vitalCard("Tiempo de carga", v.loadTime, 2500, 4000)}
  </div><p class="mt-3 text-xs text-ink-dim">Umbrales: verde = bueno · ámbar = mejorable · rojo = lento. Datos reales de usuarios (RUM).</p>`;
}

// --- Acciones en el tiempo (serie diaria por evento) ---
export function renderActionSeries(d: ActionSeries | null) {
  const el = $("[data-actionseries]");
  if (!el) return;
  const events = d?.events ?? [];
  if (!events.length) {
    el.innerHTML = `<div class="sm:col-span-2 lg:col-span-4">${placeholder("Requiere <code class='text-ink-soft'>/panel/action-series</code> (GoatCounter daily). Si está desplegado y vacío, aún no hay eventos con serie diaria en este periodo.")}</div>`;
    return;
  }
  const colorFor = (n: string) =>
    n.startsWith("download") ? "#22c55e" :
    n.startsWith("donate") ? "#8b5cf6" :
    n.startsWith("demo") || n.startsWith("showcase") ? "#22d3ee" :
    n.startsWith("section") || n.startsWith("scroll") ? "#3b82f6" : "#e0a060";
  el.innerHTML = events.map((e) => {
    const vals = e.series.map((s) => s.count);
    const short = e.name.length > 22 ? e.name.slice(0, 21) + "…" : e.name;
    return `<div class="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate text-xs text-ink-soft" title="${esc(e.name)}">${esc(short)}</span>
        <b class="tabular-nums text-sm text-ink">${num(e.total)}</b>
      </div>
      <div class="mt-1">${sparkline(vals, colorFor(e.name)) || `<div class="h-8"></div>`}</div>
    </div>`;
  }).join("");
}
