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
    base: localStorage.getItem(LS.base) || 'http://localhost:3333',
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

  // --- Carga desde el backend ---
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
      const url = `${base.replace(/\/+$/, '')}/analytics/summary?period=${encodeURIComponent(period)}`;
      const res = await fetch(url, { headers: { 'x-api-key': key } });
      if (res.status === 401) {
        setStatus('API key inválida (401). Revísala en ⚙.', 'err');
        showConfig(true);
        return;
      }
      if (!res.ok) {
        setStatus('El backend respondió con error HTTP ' + res.status + '.', 'err');
        return;
      }
      render(await res.json());
    } catch (e) {
      setStatus(
        `No se pudo conectar a ${base}. ¿El backend está corriendo y permite CORS desde este origen? (${e.message})`,
        'err',
      );
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
