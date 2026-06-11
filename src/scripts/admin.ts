/* ============================================================
   /admin — dashboard de analítica (Astro + Tailwind, dependency-free).
   Consume el backend NestJS: /analytics/summary|events|timeseries|devices.
   La URL del backend y la API key se guardan en localStorage (solo en este navegador).
   ============================================================ */
import { site } from "../data/site";

// --- Tipos (forma de la API) ---
interface Totals { pageviews: number; visits: number }
interface Bar { label: string; views: number }
interface Provider {
  totals: Totals;
  topPages: { path: string; views: number }[];
  countries: { code?: string; name?: string; views: number }[];
  referrers: { host: string; views: number }[];
}
interface Summary {
  period: string; range: { start: string; end: string }; updatedAt: string;
  partial: boolean; goatcounter: Provider | null; cloudflare: Provider | null;
}
interface EventItem { name: string; count: number }
interface Events { events: EventItem[]; partial: boolean }
interface SeriesPoint { date: string; views: number; visits?: number; hourly?: number[] }
interface Timeseries { goatcounter: SeriesPoint[] | null; cloudflare: SeriesPoint[] | null; partial: boolean }
interface DeviceRow { name: string; count: number }
interface Devices { browsers: DeviceRow[]; systems: DeviceRow[]; sizes: DeviceRow[]; partial: boolean }

// --- Helpers DOM/formato ---
const $ = <T extends Element = HTMLElement>(s: string): T | null => document.querySelector<T>(s);
const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const num = (n: unknown): string => Number(n ?? 0).toLocaleString("es-PE");
const fmtShort = (n: number): string => {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
  return String(n);
};
const pct = (n: number, d: number): number => (d ? Math.round((n / d) * 100) : 0);
const avg = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

const LS = { base: "sp-admin-api-base", key: "sp-admin-api-key", period: "sp-admin-period" };
const cfg = () => ({
  base: localStorage.getItem(LS.base) || site.analyticsApi,
  key: localStorage.getItem(LS.key) || "",
});

const statusEl = $("[data-status]");
const dashEl = $("[data-dashboard]");
const cfgForm = $<HTMLFormElement>("[data-config]");

function setStatus(msg: string, kind: "info" | "warn" | "err" = "info") {
  if (!statusEl) return;
  const map = {
    info: "border-white/12 bg-white/5 text-ink-soft",
    warn: "border-amber/30 bg-amber/10 text-amber",
    err: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  statusEl.className = "mt-5 rounded-xl border px-4 py-3 text-sm " + map[kind];
  statusEl.textContent = msg;
  statusEl.hidden = !msg;
}
const showConfig = (show: boolean) => { if (cfgForm) cfgForm.hidden = !show; };

// --- Init formulario ---
const apiBaseInput = $<HTMLInputElement>("[data-api-base]");
const apiKeyInput = $<HTMLInputElement>("[data-api-key]");
const periodSel = $<HTMLSelectElement>("[data-period]");
if (apiBaseInput) apiBaseInput.value = cfg().base;
if (apiKeyInput) apiKeyInput.value = cfg().key;
if (periodSel) periodSel.value = localStorage.getItem(LS.period) || "7d";

cfgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  localStorage.setItem(LS.base, apiBaseInput?.value.trim() || "");
  localStorage.setItem(LS.key, apiKeyInput?.value.trim() || "");
  showConfig(false);
  load();
});
$("[data-config-btn]")?.addEventListener("click", () => showConfig(!!cfgForm?.hidden));
$("[data-refresh]")?.addEventListener("click", () => load());
periodSel?.addEventListener("change", () => {
  localStorage.setItem(LS.period, periodSel.value);
  load();
});

// --- Render: lista de barras ---
function barList(items: Bar[], topN = 7): string {
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

// --- Sparkline SVG ---
function sparkline(values: number[], color: string): string {
  if (values.length < 2) return "";
  const w = 120, h = 32, max = Math.max(...values, 1), min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`);
  return `<svg viewBox="0 0 ${w} ${h}" class="h-8 w-full" preserveAspectRatio="none">
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts.join(" ")}" />
  </svg>`;
}
// Tendencia interna del periodo (último tercio vs primero)
function trend(values: number[]): number | null {
  if (values.length < 4) return null;
  const k = Math.max(1, Math.floor(values.length / 3));
  const a = avg(values.slice(0, k)), b = avg(values.slice(-k));
  return a ? Math.round(((b - a) / a) * 100) : null;
}

// --- KPIs ---
function renderKpis(s: Summary, ts: Timeseries | null) {
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
function niceScale(max: number, ticks: number) {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const exp = Math.floor(Math.log10(max / Math.max(1, ticks)));
  const f = (max / Math.max(1, ticks)) / Math.pow(10, exp);
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * Math.pow(10, exp);
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + step * 0.001; v += step) out.push(Math.round(v));
  return { top, ticks: out };
}
function renderChart(ts: Timeseries | null) {
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

  // Tooltip
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

// --- Funnel ---
function sumEvents(events: EventItem[], prefix: string): number {
  return events.filter((e) => e.name === prefix || e.name.startsWith(prefix + "/")).reduce((a, e) => a + e.count, 0);
}
function renderFunnel(s: Summary, ev: Events | null) {
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

// --- Comparación GC vs CF ---
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
function renderCompare(s: Summary) {
  const el = $("[data-compare]");
  if (!el) return;
  el.innerHTML = providerCard("GoatCounter", "📊", s.goatcounter) + providerCard("Cloudflare", "🌐", s.cloudflare);
}

// --- Países / Fuentes (prefiere Cloudflare, cae a GoatCounter) ---
function renderGeo(s: Summary) {
  const src = s.cloudflare ?? s.goatcounter;
  const cEl = $("[data-countries]"), rEl = $("[data-referrers]");
  if (cEl) cEl.innerHTML = barList((src?.countries ?? []).map((c) => ({ label: c.name || c.code || "?", views: c.views })));
  if (rEl) rEl.innerHTML = barList((src?.referrers ?? []).map((r) => ({ label: r.host || "(directo)", views: r.views })));
}

// --- Eventos agrupados ("acciones de los usuarios") ---
const GROUPS: { title: string; match: (n: string) => boolean }[] = [
  { title: "⬇️ Descargas", match: (n) => n.startsWith("download") },
  { title: "💜 Donaciones", match: (n) => n.startsWith("donate") },
  { title: "✨ Engagement", match: (n) => n.startsWith("demo") || n.startsWith("showcase") || n === "github" },
  { title: "🧭 Navegación", match: (n) => n.startsWith("section") || n.startsWith("scroll") },
  { title: "🌐 Idioma", match: (n) => n.startsWith("lang") },
];
function renderEvents(ev: Events | null) {
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

// --- Dispositivos (endpoint opcional) ---
function placeholder(msg: string): string {
  return `<div class="rounded-xl border border-dashed border-white/12 bg-white/[0.015] p-5 text-sm text-ink-dim">${msg}</div>`;
}
function renderDevices(d: Devices | null) {
  const el = $("[data-devices]");
  if (!el) return;
  if (!d) { el.innerHTML = placeholder("Requiere el endpoint <code class='text-ink-soft'>/panel/devices</code> en el backend (navegador · SO · tamaño de pantalla). Pendiente de desplegar."); return; }
  el.innerHTML = `<div class="grid gap-4 sm:grid-cols-3">
    <div><h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Navegador</h4>${barList(d.browsers.map((x) => ({ label: x.name, views: x.count })), 5)}</div>
    <div><h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Sistema</h4>${barList(d.systems.map((x) => ({ label: x.name, views: x.count })), 5)}</div>
    <div><h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Pantalla</h4>${barList(d.sizes.map((x) => ({ label: x.name, views: x.count })), 5)}</div>
  </div>`;
}

// --- Heatmap día × hora (usa hourly de GoatCounter si está) ---
function renderHeatmap(ts: Timeseries | null) {
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

// --- Carga ---
async function fetchJson<T>(path: string, period: string): Promise<T | null> {
  const { base, key } = cfg();
  const url = `${base.replace(/\/+$/, "")}${path}?period=${encodeURIComponent(period)}`;
  const res = await fetch(url, { headers: { "x-api-key": key } });
  if (res.status === 401) { const e = new Error("401"); (e as Error & { code?: number }).code = 401; throw e; }
  if (!res.ok) return null; // 404 (endpoint no desplegado) → degradación elegante
  return res.json() as Promise<T>;
}

async function load() {
  const { base, key } = cfg();
  if (!key || !base) { setStatus("Configura la URL del backend y la API key (⚙) para empezar.", "warn"); showConfig(true); return; }
  const period = periodSel?.value || "7d";
  setStatus("Cargando…");
  if (dashEl) dashEl.hidden = true;
  try {
    // Rutas neutras (/panel/*, "actions" en vez de "events"): los bloqueadores de anuncios
    // tumban cualquier URL con "analytics"/"events" (ERR_BLOCKED_BY_CLIENT).
    const summary = await fetchJson<Summary>("/panel/summary", period);
    if (!summary) throw new Error("summary vacío");
    const [tsR, evR, dvR] = await Promise.allSettled([
      fetchJson<Timeseries>("/panel/timeseries", period),
      fetchJson<Events>("/panel/actions", period),
      fetchJson<Devices>("/panel/devices", period),
    ]);
    const ts = tsR.status === "fulfilled" ? tsR.value : null;
    const ev = evR.status === "fulfilled" ? evR.value : null;
    const dv = dvR.status === "fulfilled" ? dvR.value : null;

    setStatus("");
    if (dashEl) { dashEl.hidden = false; dashEl.classList.add("flex"); }
    renderKpis(summary, ts);
    renderChart(ts);
    renderFunnel(summary, ev);
    renderCompare(summary);
    renderGeo(summary);
    renderEvents(ev);
    renderDevices(dv);
    renderHeatmap(ts);

    const upd = (() => { try { return new Date(summary.updatedAt).toLocaleString("es-PE"); } catch { return summary.updatedAt; } })();
    setStatus(`Periodo ${summary.period} · ${summary.range.start} → ${summary.range.end} · actualizado ${upd}${summary.partial ? " · ⚠️ datos parciales" : ""}`, summary.partial ? "warn" : "info");
  } catch (e) {
    const err = e as Error & { code?: number };
    if (err.code === 401) { setStatus("API key inválida (401). Revísala en ⚙.", "err"); showConfig(true); }
    else setStatus(`No se pudo conectar a ${cfg().base}. ¿El backend está activo y permite CORS? (${err.message})`, "err");
  }
}

// Primera carga
if (cfg().key) load();
else { showConfig(true); setStatus("Configura el backend (⚙) para ver los datos.", "info"); }
