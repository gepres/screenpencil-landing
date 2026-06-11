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
  const pct = (n, d) => (d ? Math.round((Number(n) / Number(d)) * 100) : 0);
  const fmtShort = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
    return String(n);
  };
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

  // Estado del dashboard (para re-render del gráfico y cálculo de conversión)
  let _ts = null, _summary = null, _logScale = false;

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
  function barlist(items, { topN = 8 } = {}) {
    if (!items || !items.length) return '<p class="muted">Sin datos.</p>';
    const total = items.reduce((a, i) => a + (i.views || 0), 0) || 1;
    let rows = items.slice().sort((a, b) => (b.views || 0) - (a.views || 0));
    if (rows.length > topN) {
      const rest = rows.slice(topN);
      const restViews = rest.reduce((a, i) => a + (i.views || 0), 0);
      rows = rows.slice(0, topN).concat([{ label: `Otros (${rest.length})`, views: restViews, _other: true }]);
    }
    const max = Math.max(...rows.map((i) => i.views || 0), 1);
    return (
      '<ul class="barlist">' +
      rows
        .map((i) => {
          const v = i.views || 0;
          const w = Math.round((v / max) * 100);
          return `<li${i._other ? ' class="barlist__other"' : ''}><span class="barlist__lab" title="${esc(i.label)}">${esc(i.label)}</span>
            <span class="barlist__bar"><span style="width:${w}%"></span></span>
            <span class="barlist__val">${num(v)} <small>${pct(v, total)}%</small></span></li>`;
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
    _summary = d;
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
      <div class="kpi kpi--accent" id="kpiConv"><span class="kpi__k">Conversión</span><span class="kpi__v" id="convVal">—</span><span class="kpi__s" id="convSub">visitas → descarga</span></div>
      <div class="kpi kpi--meta"><span class="kpi__k">Periodo ${esc(d.period)} ${partial}</span><span class="kpi__s">${esc(d.range?.start)} → ${esc(d.range?.end)}</span><span class="kpi__s">actualizado: ${esc(updated)}</span></div>
    `;
    $('#panel-gc .panel__body').innerHTML = providerPanel(d.goatcounter);
    $('#panel-cf .panel__body').innerHTML = providerPanel(d.cloudflare);
  }

  // --- Escala "bonita" para el eje Y (ticks redondeados 1-2-5) ---
  function niceNum(range, round) {
    const exp = Math.floor(Math.log10(range || 1));
    const f = (range || 1) / Math.pow(10, exp);
    const nf = round
      ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10)
      : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
    return nf * Math.pow(10, exp);
  }
  function niceScale(max, tickCount) {
    if (max <= 0) return { top: 1, ticks: [0, 1] };
    const step = niceNum(max / Math.max(1, tickCount), true);
    const top = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = 0; v <= top + step * 0.001; v += step) ticks.push(Math.round(v));
    return { top, ticks };
  }
  // Δ del periodo: media del último tercio vs el primero (tendencia interna, no vs periodo anterior).
  function trendPct(arr) {
    if (arr.length < 4) return null;
    const k = Math.max(1, Math.floor(arr.length / 3));
    const a = avg(arr.slice(0, k)), b = avg(arr.slice(-k));
    return a ? Math.round(((b - a) / a) * 100) : null;
  }

  // Gráfico de líneas SVG (sin dependencias): eje Y con ticks + gridlines, eje X con
  // varias fechas, marcadores, tooltip al pasar el cursor y escala lineal/log conmutable.
  function renderChart(ts) {
    if (ts) _ts = ts;
    const el = $('#chart');
    const legend = $('#chartLegend');
    const series = [
      { name: 'GoatCounter', color: '#22d3ee', data: (_ts && _ts.goatcounter) || [] },
      { name: 'Cloudflare', color: '#3b82f6', data: (_ts && _ts.cloudflare) || [] },
    ].filter((s) => s.data.length);

    const dateSet = new Set();
    series.forEach((s) => s.data.forEach((p) => dateSet.add(p.date)));
    const dates = [...dateSet].sort();
    if (!dates.length) {
      el.innerHTML = '<p class="chart__empty">Sin datos de serie en este periodo.</p>';
      legend.innerHTML = '';
      return;
    }
    series.forEach((s) => (s.map = new Map(s.data.map((p) => [p.date, p.views || 0]))));
    const rawMax = Math.max(1, ...series.flatMap((s) => s.data.map((p) => p.views || 0)));

    const W = 640, H = 240, padL = 46, padR = 14, padT = 14, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const useLog = _logScale && rawMax > 1;

    // Eje Y: ticks lineales "nice" o décadas en log
    let yTicks, sMax;
    if (useLog) {
      sMax = Math.ceil(Math.log10(rawMax + 1));
      yTicks = [];
      for (let e = 0; e <= sMax; e++) yTicks.push(Math.pow(10, e));
    } else {
      const ns = niceScale(rawMax, 4);
      sMax = ns.top; yTicks = ns.ticks;
    }
    const sval = (v) => (useLog ? Math.log10((v || 0) + 1) : v || 0);
    const x = (i) => (dates.length === 1 ? padL + plotW / 2 : padL + (i * plotW) / (dates.length - 1));
    const step = dates.length > 1 ? plotW / (dates.length - 1) : plotW;
    const y = (v) => padT + plotH * (1 - sval(v) / sMax);

    const grid = yTicks
      .map((t) => {
        const yy = y(t).toFixed(1);
        return `<line class="chart__grid" x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"/>` +
          `<text class="chart__axis" x="${padL - 6}" y="${yy}" text-anchor="end" dominant-baseline="middle">${fmtShort(t)}</text>`;
      })
      .join('');

    const showDots = dates.length <= 31;
    const baseY = (padT + plotH).toFixed(1);
    const body = series
      .map((s) => {
        const pts = dates.map((d, i) => `${x(i).toFixed(1)},${y(s.map.get(d) || 0).toFixed(1)}`);
        const area = `M ${x(0).toFixed(1)},${baseY} L ${pts.join(' L ')} L ${x(dates.length - 1).toFixed(1)},${baseY} Z`;
        const dots = showDots
          ? dates.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(s.map.get(d) || 0).toFixed(1)}" r="2.6" fill="${s.color}"/>`).join('')
          : '';
        return `<path class="chart__area" fill="${s.color}" d="${area}"/>` +
          `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.join(' ')}"/>` + dots;
      })
      .join('');

    const nX = Math.min(dates.length, 6);
    const xIdx = dates.length === 1 ? [0] : Array.from({ length: nX }, (_, k) => Math.round((k * (dates.length - 1)) / (nX - 1)));
    const xlabels = [...new Set(xIdx)]
      .map((i) => {
        const anchor = i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle';
        return `<text class="chart__axis" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}">${esc(dates[i].slice(5))}</text>`;
      })
      .join('');

    el.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendencia de páginas vistas por día">` +
      grid + body + xlabels +
      `<line id="chartGuide" class="chart__guide" x1="0" y1="${padT}" x2="0" y2="${padT + plotH}" style="display:none"/>` +
      `</svg><div class="chart__tip" id="chartTip" hidden></div>`;

    const tr = trendPct(dates.map((d) => series[0].map.get(d) || 0));
    const trHtml = tr === null ? '' :
      `<span class="kpi__delta kpi__delta--${tr >= 0 ? 'up' : 'down'}">${tr >= 0 ? '▲' : '▼'} ${Math.abs(tr)}% en el periodo</span>`;
    legend.innerHTML =
      series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('') +
      `<span class="chart__dot">máx/día: ${num(rawMax)}</span>` + trHtml +
      `<button class="chart__toggle" id="logToggle" aria-pressed="${useLog}">escala log</button>`;
    $('#logToggle').addEventListener('click', () => { _logScale = !_logScale; renderChart(); });

    // Tooltip interactivo: guía vertical + valores por serie en la fecha más cercana
    const svg = el.querySelector('svg');
    const tip = $('#chartTip');
    const gd = $('#chartGuide');
    svg.addEventListener('mousemove', (ev2) => {
      const r = svg.getBoundingClientRect();
      let i = Math.round((((ev2.clientX - r.left) / r.width) * W - padL) / step);
      i = Math.max(0, Math.min(dates.length - 1, i));
      const gx = x(i);
      gd.setAttribute('x1', gx); gd.setAttribute('x2', gx); gd.style.display = '';
      tip.innerHTML = `<b>${esc(dates[i])}</b>` +
        series.map((s) => `<div><i style="background:${s.color}"></i>${esc(s.name)}: <b>${num(s.map.get(dates[i]) || 0)}</b></div>`).join('');
      tip.hidden = false;
      tip.style.left = Math.max(4, Math.min(r.width - 4, (gx / W) * r.width)) + 'px';
    });
    svg.addEventListener('mouseleave', () => { tip.hidden = true; gd.style.display = 'none'; });
  }

  function renderEvents(ev) {
    const el = $('#eventsBody');
    if (!ev || !ev.events || !ev.events.length) {
      el.innerHTML = '<p class="muted">Sin eventos en este periodo.</p>';
    } else {
      el.innerHTML = barlist(ev.events.map((e) => ({ label: e.name, views: e.count })));
    }
    updateConversion(ev);
  }

  // Conversión visitas → descarga: suma de eventos "download*" / visitas del periodo.
  function updateConversion(ev) {
    const v = $('#convVal');
    if (!v || !_summary) return;
    const dl = ((ev && ev.events) || [])
      .filter((e) => /^download\b/i.test(e.name))
      .reduce((a, e) => a + (e.count || 0), 0);
    const visits = _summary.cloudflare?.totals.visits || _summary.goatcounter?.totals.pageviews || 0;
    const sub = $('#convSub');
    if (!visits) { v.textContent = '—'; return; }
    v.textContent = pct(dl, visits) + '%';
    if (sub) sub.textContent = `${num(dl)} descargas / ${num(visits)} visitas`;
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
