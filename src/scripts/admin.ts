/* ============================================================
   /admin — dashboard de analítica (Astro + Tailwind, dependency-free).
   Entry point: configuración, carga de datos y orquestación de los renders.
   Estructura:
     admin/types.ts   → formas de la API
     admin/format.ts  → $, esc, num, pct… (helpers puros)
     admin/charts.ts  → barList, sparkline, donut, columns… (primitivas)
     admin/render.ts  → render<Sección>() (pintan cada bloque)
   Consume el backend NestJS por el prefijo neutro /panel/* (los adblockers
   tumban URLs con "analytics"/"events"). API key en localStorage.
   ============================================================ */
import { site } from "../data/site";
import type { ActionSeries, Devices, Events, Summary, Timeseries, Vitals } from "./admin/types";
import { $, toCsv } from "./admin/format";
import {
  renderActionSeries, renderChart, renderCompare, renderDevices, renderEvents,
  renderFunnel, renderGeo, renderHeatmap, renderKpis, renderMap, renderReadDepth,
  renderTimePatterns, renderVitals,
} from "./admin/render";

// --- Configuración (localStorage; solo en este navegador) ---
const LS = { base: "sp-admin-api-base", key: "sp-admin-api-key", period: "sp-admin-period" };
const cfg = () => ({
  base: localStorage.getItem(LS.base) || site.analyticsApi,
  key: localStorage.getItem(LS.key) || "",
});

/** Datos del último fetch (para exportar a CSV). */
let last: { summary: Summary | null; events: Events | null; ts: Timeseries | null; devices: Devices | null } = {
  summary: null, events: null, ts: null, devices: null,
};

// --- Elementos + estado de UI ---
const statusEl = $("[data-status]");
const dashEl = $("[data-dashboard]");
const cfgForm = $<HTMLFormElement>("[data-config]");
const apiBaseInput = $<HTMLInputElement>("[data-api-base]");
const apiKeyInput = $<HTMLInputElement>("[data-api-key]");
const periodSel = $<HTMLSelectElement>("[data-period]");
const startInput = $<HTMLInputElement>("[data-start]");
const endInput = $<HTMLInputElement>("[data-end]");

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
// Alterna la CLASE Tailwind `hidden` (no el atributo): mezclarlos dejaba el panel en display:none.
const showConfig = (show: boolean) => {
  if (!cfgForm) return;
  cfgForm.classList.toggle("hidden", !show);
  cfgForm.classList.toggle("grid", show);
};
/** Muestra/oculta los inputs de fecha según si el periodo es "custom". */
function syncCustomInputs() {
  const isCustom = periodSel?.value === "custom";
  startInput?.classList.toggle("hidden", !isCustom);
  endInput?.classList.toggle("hidden", !isCustom);
}

// --- Init del formulario ---
if (apiBaseInput) apiBaseInput.value = cfg().base;
if (apiKeyInput) apiKeyInput.value = cfg().key;
if (periodSel) periodSel.value = localStorage.getItem(LS.period) || "7d";
syncCustomInputs();

// --- Listeners ---
cfgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  localStorage.setItem(LS.base, apiBaseInput?.value.trim() || "");
  localStorage.setItem(LS.key, apiKeyInput?.value.trim() || "");
  showConfig(false);
  load();
});
$("[data-config-btn]")?.addEventListener("click", () => showConfig(cfgForm?.classList.contains("hidden") ?? true));
$("[data-refresh]")?.addEventListener("click", () => load());
$("[data-export]")?.addEventListener("click", () => exportCsv());
periodSel?.addEventListener("change", () => {
  if (periodSel) localStorage.setItem(LS.period, periodSel.value);
  syncCustomInputs();
  if (periodSel?.value !== "custom") load();
});
[startInput, endInput].forEach((inp) =>
  inp?.addEventListener("change", () => {
    if (startInput?.value && endInput?.value) load();
  }),
);

// --- Export CSV ---
function exportCsv() {
  if (!last.summary) { setStatus("Carga datos antes de exportar.", "warn"); return; }
  const src = last.summary.cloudflare ?? last.summary.goatcounter;
  const rows: (string | number)[][] = [["seccion", "etiqueta", "valor"]];
  (src?.topPages ?? []).forEach((p) => rows.push(["pagina", p.path, p.views]));
  (src?.countries ?? []).forEach((c) => rows.push(["pais", c.name || c.code || "?", c.views]));
  (src?.referrers ?? []).forEach((r) => rows.push(["fuente", r.host || "(directo)", r.views]));
  (last.events?.events ?? []).forEach((e) => rows.push(["accion", e.name, e.count]));
  (last.devices?.browsers ?? []).forEach((d) => rows.push(["navegador", d.name, d.count]));
  (last.devices?.systems ?? []).forEach((d) => rows.push(["sistema", d.name, d.count]));
  (last.devices?.sizes ?? []).forEach((d) => rows.push(["pantalla", d.name, d.count]));
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `screenpencil-analytics-${last.summary.period}-${last.summary.range.end}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- Carga de datos ---
async function fetchJson<T>(path: string, qs: string): Promise<T | null> {
  const { base, key } = cfg();
  const url = `${base.replace(/\/+$/, "")}${path}?${qs}`;
  const res = await fetch(url, { headers: { "x-api-key": key } });
  if (res.status === 401) { const e = new Error("401"); (e as Error & { code?: number }).code = 401; throw e; }
  if (!res.ok) return null; // 404 (endpoint no desplegado) → degradación elegante
  return res.json() as Promise<T>;
}

/** Query string del periodo seleccionado: preset (`period=`) o rango (`start=&end=`). */
function buildQuery(): string | null {
  const p = periodSel?.value || "7d";
  if (p === "custom") {
    const s = startInput?.value, e = endInput?.value;
    if (!s || !e) { setStatus("Elige las dos fechas (desde y hasta).", "warn"); return null; }
    if (s > e) { setStatus("La fecha «desde» debe ser anterior a «hasta».", "warn"); return null; }
    return `start=${encodeURIComponent(s)}&end=${encodeURIComponent(e)}`;
  }
  return `period=${encodeURIComponent(p)}`;
}

async function load() {
  const { base, key } = cfg();
  if (!key || !base) { setStatus("Configura la URL del backend y la API key (⚙) para empezar.", "warn"); showConfig(true); return; }
  const qs = buildQuery();
  if (qs === null) return;
  setStatus("Cargando…");
  if (dashEl) { dashEl.classList.add("hidden"); dashEl.classList.remove("flex"); }
  try {
    const summary = await fetchJson<Summary>("/panel/summary", qs);
    if (!summary) throw new Error("summary vacío");
    const [tsR, evR, dvR, vtR, asR] = await Promise.allSettled([
      fetchJson<Timeseries>("/panel/timeseries", qs),
      fetchJson<Events>("/panel/actions", qs),
      fetchJson<Devices>("/panel/devices", qs),
      fetchJson<Vitals>("/panel/vitals", qs),
      fetchJson<ActionSeries>("/panel/action-series", qs),
    ]);
    const ts = tsR.status === "fulfilled" ? tsR.value : null;
    const ev = evR.status === "fulfilled" ? evR.value : null;
    const dv = dvR.status === "fulfilled" ? dvR.value : null;
    const vt = vtR.status === "fulfilled" ? vtR.value : null;
    const as = asR.status === "fulfilled" ? asR.value : null;
    last = { summary, events: ev, ts, devices: dv };

    setStatus("");
    if (dashEl) { dashEl.classList.remove("hidden"); dashEl.classList.add("flex"); }
    // Cada render aislado: un fallo puntual con datos inesperados no tumba el resto.
    const safe = (fn: () => void) => { try { fn(); } catch (err) { console.warn("[admin] render:", err); } };
    safe(() => renderKpis(summary, ts));
    safe(() => renderChart(ts));
    safe(() => renderFunnel(summary, ev));
    safe(() => renderCompare(summary));
    safe(() => renderGeo(summary));
    safe(() => { void renderMap(summary); });
    safe(() => renderEvents(ev));
    safe(() => renderDevices(dv));
    safe(() => renderHeatmap(ts));
    safe(() => renderTimePatterns(ts));
    safe(() => renderReadDepth(ev));
    safe(() => renderVitals(vt));
    safe(() => renderActionSeries(as));

    const upd = (() => { try { return new Date(summary.updatedAt).toLocaleString("es-PE"); } catch { return summary.updatedAt; } })();
    setStatus(`Periodo ${summary.period} · ${summary.range.start} → ${summary.range.end} · actualizado ${upd}${summary.partial ? " · ⚠️ datos parciales" : ""}`, summary.partial ? "warn" : "info");
  } catch (e) {
    const err = e as Error & { code?: number };
    if (err.code === 401) { setStatus("API key inválida (401). Revísala en ⚙.", "err"); showConfig(true); }
    else setStatus(`No se pudo conectar a ${cfg().base}. ¿El backend está activo y permite CORS? (${err.message})`, "err");
  }
}

// --- Primera carga ---
if (cfg().key) load();
else { showConfig(true); setStatus("Configura el backend (⚙) para ver los datos.", "info"); }
