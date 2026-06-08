/* ============================================================
   /admin — consume el backend NestJS (GET /analytics/summary).
   La URL del backend y la API key se guardan en localStorage (solo en este navegador).
   Sin dependencias: barras en CSS.
   ============================================================ */
(() => {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const LS = { base: 'sp-admin-api-base', key: 'sp-admin-api-key', period: 'sp-admin-period' };
  const getCfg = () => ({
    // Por defecto apunta al backend en producción; para desarrollo local cámbialo en ⚙ a http://localhost:3333
    base: localStorage.getItem(LS.base) || 'https://screenpencil-backend.onrender.com',
    key: localStorage.getItem(LS.key) || '',
  });

  const statusEl = $('#status');
  const dashEl = $('#dashboard');
  const cfgForm = $('#cfg');

  const setStatus = (msg, kind = 'info') => {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (msg ? ' status--' + kind : '');
    statusEl.hidden = !msg;
  };
  const showConfig = (show = true) => { cfgForm.hidden = !show; };

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Number(n ?? 0).toLocaleString('es-PE');

  // --- Inicializar formulario con la config guardada ---
  const cfg0 = getCfg();
  $('#apiBase').value = cfg0.base;
  $('#apiKey').value = cfg0.key;
  $('#period').value = localStorage.getItem(LS.period) || '7d';

  cfgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    localStorage.setItem(LS.base, $('#apiBase').value.trim());
    localStorage.setItem(LS.key, $('#apiKey').value.trim());
    showConfig(false);
    load();
  });
  $('#cfgBtn').addEventListener('click', () => showConfig(cfgForm.hidden));
  $('#refresh').addEventListener('click', () => load());
  $('#period').addEventListener('change', () => {
    localStorage.setItem(LS.period, $('#period').value);
    load();
  });

  // --- Render ---
  function barlist(items) {
    if (!items || !items.length) return '<p class="muted">Sin datos.</p>';
    const max = Math.max(...items.map((i) => i.views || 0), 1);
    return (
      '<ul class="barlist">' +
      items
        .map((i) => {
          const w = Math.round(((i.views || 0) / max) * 100);
          return `<li><span class="barlist__lab" title="${esc(i.label)}">${esc(i.label)}</span>
            <span class="barlist__bar"><span style="width:${w}%"></span></span>
            <span class="barlist__val">${num(i.views)}</span></li>`;
        })
        .join('') +
      '</ul>'
    );
  }

  function providerPanel(p) {
    if (!p) return '<p class="muted">Fuente no configurada o sin respuesta.</p>';
    return `
      <div class="panel__totals">
        <div><strong>${num(p.totals.pageviews)}</strong><span>páginas vistas</span></div>
        <div><strong>${num(p.totals.visits)}</strong><span>visitas</span></div>
      </div>
      <h3>Páginas</h3>${barlist(p.topPages.map((x) => ({ label: x.path, views: x.views })))}
      <h3>Países</h3>${barlist(p.countries.map((x) => ({ label: x.name || x.code || '?', views: x.views })))}
      <h3>Fuentes</h3>${barlist(p.referrers.map((x) => ({ label: x.host || '(directo)', views: x.views })))}
    `;
  }

  function render(d) {
    setStatus('');
    dashEl.hidden = false;
    const partial = d.partial
      ? '<span class="badge badge--warn">parcial</span>'
      : '<span class="badge badge--ok">completo</span>';
    let updated = '';
    try { updated = new Date(d.updatedAt).toLocaleString('es-PE'); } catch (_) { updated = d.updatedAt; }

    $('#kpis').innerHTML = `
      <div class="kpi"><span class="kpi__k">GoatCounter</span><span class="kpi__v">${num(d.goatcounter?.totals.pageviews)}</span><span class="kpi__s">páginas vistas</span></div>
      <div class="kpi"><span class="kpi__k">Cloudflare</span><span class="kpi__v">${num(d.cloudflare?.totals.pageviews)}</span><span class="kpi__s">páginas vistas</span></div>
      <div class="kpi"><span class="kpi__k">Cloudflare</span><span class="kpi__v">${num(d.cloudflare?.totals.visits)}</span><span class="kpi__s">visitas</span></div>
      <div class="kpi kpi--meta"><span class="kpi__k">Periodo ${esc(d.period)} ${partial}</span><span class="kpi__s">${esc(d.range?.start)} → ${esc(d.range?.end)}</span><span class="kpi__s">actualizado: ${esc(updated)}</span></div>
    `;
    $('#panel-gc .panel__body').innerHTML = providerPanel(d.goatcounter);
    $('#panel-cf .panel__body').innerHTML = providerPanel(d.cloudflare);
  }

  // Gráfico de líneas SVG (sin dependencias) para la serie diaria.
  function renderChart(ts) {
    const el = $('#chart');
    const legend = $('#chartLegend');
    const series = [
      { name: 'GoatCounter', color: '#22d3ee', data: (ts && ts.goatcounter) || [] },
      { name: 'Cloudflare', color: '#3b82f6', data: (ts && ts.cloudflare) || [] },
    ].filter((s) => s.data.length);

    const dateSet = new Set();
    series.forEach((s) => s.data.forEach((p) => dateSet.add(p.date)));
    const dates = [...dateSet].sort();
    if (!dates.length) {
      el.innerHTML = '<p class="chart__empty">Sin datos de serie en este periodo.</p>';
      legend.innerHTML = '';
      return;
    }
    const maxY = Math.max(1, ...series.flatMap((s) => s.data.map((p) => p.views || 0)));
    const W = 600, H = 200, padL = 6, padT = 10, padB = 18;
    const x = (i) => (dates.length === 1 ? W / 2 : padL + (i * (W - padL * 2)) / (dates.length - 1));
    const y = (v) => padT + (H - padT - padB) * (1 - v / maxY);
    const poly = (s) => {
      const m = new Map(s.data.map((p) => [p.date, p.views || 0]));
      return dates.map((d, i) => `${x(i).toFixed(1)},${y(m.get(d) || 0).toFixed(1)}`).join(' ');
    };
    const lines = series
      .map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${poly(s)}"/>`)
      .join('');
    const labels = `<text x="${x(0)}" y="${H - 3}" fill="#5e6a86" font-size="11">${esc(dates[0])}</text>` +
      `<text x="${x(dates.length - 1)}" y="${H - 3}" fill="#5e6a86" font-size="11" text-anchor="end">${esc(dates[dates.length - 1])}</text>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendencia diaria de páginas vistas">${lines}${labels}</svg>`;
    legend.innerHTML = series
      .map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`)
      .join('') + `<span class="chart__dot">máx/día: ${num(maxY)}</span>`;
  }

  function renderEvents(ev) {
    const el = $('#eventsBody');
    if (!ev || !ev.events || !ev.events.length) {
      el.innerHTML = '<p class="muted">Sin eventos en este periodo.</p>';
      return;
    }
    el.innerHTML = barlist(ev.events.map((e) => ({ label: e.name, views: e.count })));
  }

  // --- Carga desde el backend ---
  async function fetchJson(path, period, base, key) {
    const url = `${base.replace(/\/+$/, '')}${path}?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, { headers: { 'x-api-key': key } });
    if (res.status === 401) {
      const err = new Error('401');
      err.code = 401;
      throw err;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function load() {
    const { base, key } = getCfg();
    if (!key || !base) {
      setStatus('Configura la URL del backend y la API key para empezar.', 'warn');
      showConfig(true);
      return;
    }
    const period = $('#period').value;
    setStatus('Cargando…');
    dashEl.hidden = true;
    try {
      // Resumen primero (si falla, error global). Serie y eventos no bloquean.
      const summary = await fetchJson('/analytics/summary', period, base, key);
      render(summary);
      dashEl.hidden = false;
      const [ts, ev] = await Promise.allSettled([
        fetchJson('/analytics/timeseries', period, base, key),
        fetchJson('/analytics/events', period, base, key),
      ]);
      renderChart(ts.status === 'fulfilled' ? ts.value : null);
      renderEvents(ev.status === 'fulfilled' ? ev.value : null);
    } catch (e) {
      if (e.code === 401) {
        setStatus('API key inválida (401). Revísala en ⚙.', 'err');
        showConfig(true);
      } else {
        setStatus(
          `No se pudo conectar a ${base}. ¿El backend está corriendo y permite CORS desde este origen? (${e.message})`,
          'err',
        );
      }
    }
  }

  // Primera carga: si ya hay API key, cargar; si no, pedir configuración.
  if (getCfg().key) {
    load();
  } else {
    showConfig(true);
    setStatus('Configura el backend (⚙) para ver los datos.', 'info');
  }
})();
