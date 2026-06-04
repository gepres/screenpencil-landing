/* ============================================================
   ScreenPencil — Landing · JS vanilla (sin framework)
   - Nav sticky + menú móvil
   - Barra de progreso de scroll
   - Reveal al hacer scroll (IntersectionObserver)
   - Contadores animados del hero
   - Brillo que sigue al cursor en las cards
   - Demo de dibujo en <canvas>
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año del footer ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Idioma ES / EN ---------- */
  // Los textos viven en español en el DOM; su versión inglesa va en data-en (innerHTML).
  const i18nEls = $$('[data-en]');
  const esStore = new Map(i18nEls.map((el) => [el, el.innerHTML]));
  const titles = {
    es: 'ScreenPencil — Dibuja sobre toda tu pantalla. Gratis.',
    en: 'ScreenPencil — Draw over your entire screen. Free.',
  };
  const metaDesc = $('meta[name="description"]');
  const descs = {
    es: metaDesc ? metaDesc.getAttribute('content') : '',
    en: 'ScreenPencil is the app to annotate and draw over your entire screen during presentations, classes and demos. 100% free, no accounts, no watermark. Windows, macOS and Linux.',
  };
  const applyLang = (lang) => {
    if (lang !== 'en') lang = 'es';
    document.documentElement.lang = lang;
    i18nEls.forEach((el) => {
      el.innerHTML = lang === 'en' ? (el.getAttribute('data-en') || esStore.get(el)) : esStore.get(el);
    });
    document.title = titles[lang];
    if (metaDesc) metaDesc.setAttribute('content', descs[lang]);
    const tgl = $('#langToggle');
    if (tgl) {
      tgl.textContent = lang === 'en' ? 'ES' : 'EN';
      tgl.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
    }
    try { localStorage.setItem('sp-lang', lang); } catch (_) {}
  };
  let savedLang = null;
  try { savedLang = localStorage.getItem('sp-lang'); } catch (_) {}
  const initialLang = savedLang || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
  $('#langToggle')?.addEventListener('click', () =>
    applyLang(document.documentElement.lang === 'en' ? 'es' : 'en')
  );
  applyLang(initialLang);

  /* ---------- Nav: sticky + burger ---------- */
  const nav = $('#nav');
  const burger = $('#navBurger');
  const links = $('.nav__links');

  const onScroll = () => {
    // Estado "pegado" (cambia el fondo del nav)
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 24);
    // Barra de progreso
    const progress = $('#scrollProgress');
    if (progress) {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      progress.style.width = `${Math.min(100, scrolled * 100)}%`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    // Cerrar el menú al pulsar un enlace
    $$('a', links).forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Reveal al hacer scroll ---------- */
  const revealEls = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Contadores animados (hero) ---------- */
  const counters = $$('.hero__metrics strong');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = `${prefix}${target}${suffix}`; return; }
    const dur = 1200;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    const cObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => cObs.observe(c));
  }

  /* ---------- Brillo que sigue al cursor (cards de features) ---------- */
  if (!reduce) {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Aviso para botones de descarga / GitHub (placeholder) ---------- */
  const notify = (msg) => {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%) translateY(20px)',
      background: 'rgba(15,20,36,0.95)', color: '#e8edf7', border: '1px solid rgba(255,255,255,0.14)',
      padding: '0.8rem 1.3rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600',
      boxShadow: '0 20px 60px -20px rgba(0,0,0,0.7)', zIndex: '200', opacity: '0',
      transition: 'opacity .3s, transform .3s', backdropFilter: 'blur(12px)', maxWidth: '90vw', textAlign: 'center'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; setTimeout(() => t.remove(), 350); }, 2600);
  };
  $$('[data-download]').forEach((b) =>
    b.addEventListener('click', (e) => { e.preventDefault(); notify('🚧 La descarga estará disponible muy pronto. ¡Gracias por tu interés!'); })
  );
  $$('[data-github]').forEach((b) =>
    b.addEventListener('click', (e) => { e.preventDefault(); notify('🔗 Conecta aquí tu repositorio de GitHub cuando esté público.'); })
  );
  // Donaciones (placeholder: reemplaza href="#" por tu URL real y quita data-donate)
  const donateMsg = {
    coffee: '☕ Conecta tu enlace de Buy Me a Coffee en index.html (data-donate="coffee").',
    kofi: '💙 Conecta tu enlace de Ko-fi en index.html (data-donate="kofi").',
    github: '💜 Conecta tu GitHub Sponsors en index.html (data-donate="github").',
    paypal: '🅿️ Conecta tu enlace de PayPal en index.html (data-donate="paypal").'
  };
  $$('[data-donate]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      notify(donateMsg[b.dataset.donate] || '💜 ¡Gracias por querer apoyar ScreenPencil!');
    })
  );

  /* ============================================================
     LIGHTBOX DE LA GALERÍA
     ============================================================ */
  const shots = $$('.shot');
  if (shots.length) {
    // Crear el lightbox una sola vez
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox__close" aria-label="Cerrar">✕</button><img alt="" />';
    document.body.appendChild(lb);
    const lbImg = $('img', lb);
    const lbClose = $('.lightbox__close', lb);

    const openLB = (src, alt) => {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const closeLB = () => {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    shots.forEach((shot) => {
      const frame = $('.shot__frame', shot);
      frame?.addEventListener('click', () => {
        if (shot.classList.contains('is-missing')) return; // sin imagen real → no abrir
        const img = $('img', shot);
        if (img) openLB(img.src, img.alt);
      });
    });
    lbClose.addEventListener('click', closeLB);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLB(); });
  }

  /* ============================================================
     SHOWCASE INTERACTIVO (galería de funciones)
     ============================================================ */
  const scTabs = $$('.sc-tab');
  const scImg = $('#scImg');
  const scTitle = $('#scTitle');
  if (scTabs.length && scImg) {
    const SC = {
      anotar:    { img: 'assets/img/hero-shot.png',    title: 'Anotar sobre cualquier app',     alt: 'ScreenPencil: resaltado, círculo y flecha sobre un panel web' },
      figuras:   { img: 'assets/img/fn-figuras.png',   title: 'Figuras y flechas',              alt: 'ScreenPencil: rectángulo, elipse y flecha sobre un panel' },
      texto:     { img: 'assets/img/fn-texto.png',     title: 'Texto y badges numerados',       alt: 'ScreenPencil: texto y badges numerados sobre un panel' },
      spotlight: { img: 'assets/img/fn-spotlight.png', title: 'Spotlight — enfoca la atención', alt: 'ScreenPencil: spotlight oscureciendo todo menos un KPI' },
      lupa:      { img: 'assets/img/fn-lupa.png',      title: 'Lupa con zoom',                  alt: 'ScreenPencil: lente de aumento sobre un detalle' },
      pizarra:   { img: 'assets/img/fn-pizarra.png',   title: 'Pizarra en blanco',              alt: 'ScreenPencil: lienzo blanco con un boceto' }
    };
    const scSelect = (key) => {
      const d = SC[key];
      if (!d) return;
      scImg.src = d.img;
      scImg.alt = d.alt;
      scTabs.forEach((t) => {
        const on = t.dataset.sc === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
    };
    scTabs.forEach((t) => t.addEventListener('click', () => scSelect(t.dataset.sc)));

    // Clic en la imagen → ampliar (lightbox propio del showcase)
    const slb = document.createElement('div');
    slb.className = 'lightbox';
    slb.innerHTML = '<button class="lightbox__close" aria-label="Cerrar">✕</button><img alt="" />';
    document.body.appendChild(slb);
    const slbImg = $('img', slb);
    const slbClose = () => { slb.classList.remove('is-open'); document.body.style.overflow = ''; };
    scImg.addEventListener('click', () => {
      slbImg.src = scImg.src; slbImg.alt = scImg.alt;
      slb.classList.add('is-open'); document.body.style.overflow = 'hidden';
    });
    $('.lightbox__close', slb).addEventListener('click', slbClose);
    slb.addEventListener('click', (e) => { if (e.target === slb) slbClose(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') slbClose(); });
  }

  /* ============================================================
     DEMO DE DIBUJO EN CANVAS
     ============================================================ */
  const canvas = $('#demoCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let drawing = false;
    let last = null;
    let tool = 'pen';
    let color = '#e0a060';
    let size = 6;

    // Ajustar el lienzo al tamaño real (HiDPI) conservando lo dibujado
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const prev = ctx.getImageData ? safeSnapshot() : null;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (prev) restoreSnapshot(prev, rect);
    };
    const safeSnapshot = () => {
      try { return canvas.toDataURL(); } catch (_) { return null; }
    };
    const restoreSnapshot = (data, rect) => {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = data;
    };

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const start = (e) => {
      drawing = true;
      last = pos(e);
      // Punto inicial (para que un tap deje marca)
      stroke(last, last);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!drawing) return;
      const p = pos(e);
      stroke(last, p);
      last = p;
    };
    const end = () => { drawing = false; last = null; };

    const stroke = (a, b) => {
      ctx.save();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size * 2.4;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = size;
        ctx.strokeStyle = color;
        ctx.globalAlpha = tool === 'marker' ? 0.35 : 1;
        if (tool === 'marker') ctx.lineWidth = size * 2.2;
        ctx.shadowBlur = tool === 'pen' ? 6 : 0;
        ctx.shadowColor = color;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', () => { if (!drawing) return; });

    // Toolbar: herramientas
    $$('.tool').forEach((btn) =>
      btn.addEventListener('click', () => {
        $$('.tool').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        tool = btn.dataset.tool;
        canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
      })
    );
    // Toolbar: colores
    $$('.swatch').forEach((btn) =>
      btn.addEventListener('click', () => {
        $$('.swatch').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        color = btn.dataset.color;
        // Al elegir color, salir del borrador si estaba activo
        if (tool === 'eraser') $('.tool[data-tool="pen"]')?.click();
      })
    );
    // Toolbar: grosor
    const sizeEl = $('#demoSize');
    if (sizeEl) sizeEl.addEventListener('input', () => { size = Number(sizeEl.value); });
    // Toolbar: limpiar
    $('#demoClear')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Dibujo guía de bienvenida (se borra al primer trazo del usuario)
    const welcome = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.font = "600 26px 'Space Grotesk', sans-serif";
      ctx.fillStyle = 'rgba(147,160,189,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('✦ dibuja aquí ✦', rect.width / 2, rect.height / 2);
      ctx.restore();
    };

    let firstStroke = true;
    canvas.addEventListener('pointerdown', () => {
      if (firstStroke) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        firstStroke = false;
      }
    }, { once: false });

    resize();
    welcome();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  }
})();
