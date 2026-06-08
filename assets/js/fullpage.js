/* ============================================================
   Fullpage scroll — navegación por puntos + sección activa.
   El "snap" lo hace CSS (fullpage.css); aquí solo añadimos los puntos
   laterales, el resaltado de la sección activa y los atajos de teclado.
   Se desactiva en móvil y con prefers-reduced-motion (igual que el CSS).
   ============================================================ */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width: 900px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!desktop || reduce) return;

  // Mismos paneles que en fullpage.css (por id; .finalcta no tiene id).
  const SELECTOR =
    '#hero, #features, #showcase, #flow, #demo, #hotkeys, #platforms, #download, #donate, #faq, #roadmap, .finalcta';
  const LABELS = {
    hero: 'Inicio',
    features: 'Herramientas',
    showcase: 'En acción',
    flow: 'Cómo funciona',
    demo: 'Pruébalo',
    hotkeys: 'Atajos',
    platforms: 'Plataformas',
    download: 'Descargar',
    donate: 'Apóyanos',
    faq: 'FAQ',
    roadmap: 'Próximamente',
    finalcta: 'Empezar',
  };

  const panels = Array.from(document.querySelectorAll(SELECTOR));
  if (panels.length < 2) return;

  // --- Puntos de navegación ---
  const dotsNav = document.createElement('nav');
  dotsNav.className = 'fp-dots';
  dotsNav.setAttribute('aria-label', 'Secciones');

  panels.forEach((panel) => {
    const id = panel.id || (panel.classList.contains('finalcta') ? 'finalcta' : '');
    const label = LABELS[id] || 'Sección';
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.dataset.label = label;
    dot.setAttribute('aria-label', `Ir a: ${label}`);
    dot.addEventListener('click', () =>
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
    dotsNav.appendChild(dot);
  });
  document.body.appendChild(dotsNav);
  const dots = Array.from(dotsNav.children);

  // --- Sección activa (resalta el punto) ---
  let activeIndex = 0;
  const setActive = (i) => {
    if (i === activeIndex) return;
    activeIndex = i;
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  };
  dots[0].classList.add('is-active');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(panels.indexOf(e.target));
      });
    },
    { threshold: 0.55 },
  );
  panels.forEach((p) => io.observe(p));

  // --- Teclado: PageDown/PageUp saltan de panel (las flechas siguen siendo scroll normal) ---
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return; // no interferir al escribir (demo, admin…)
    if (e.key === 'PageDown') {
      e.preventDefault();
      panels[Math.min(activeIndex + 1, panels.length - 1)].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      panels[Math.max(activeIndex - 1, 0)].scrollIntoView({ behavior: 'smooth' });
    }
  });
})();
