// Comportamiento global de la landing: reveal on scroll, toggle de idioma
// y analítica privacy-first (GoatCounter, sin cookies).

declare global {
  interface Window {
    goatcounter?: { count: (o: Record<string, unknown>) => void };
    __spI18n?: Record<"es" | "en", { title: string; desc: string }>;
  }
}

/** Único punto de integración de analítica. Cambiar de proveedor = reescribir solo esto. */
function track(name: string, title?: string) {
  try {
    if (window.goatcounter?.count) {
      window.goatcounter.count({ path: name, title: title || name, event: true });
    }
  } catch {
    /* noop */
  }
}

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll<HTMLElement>(".reveal");
if ("IntersectionObserver" in window && reveals.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

/* ---------- Contadores animados del hero (efecto de la v1) ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const counters = document.querySelectorAll<HTMLElement>("[data-metric]");
function animateCount(el: HTMLElement) {
  const target = parseFloat(el.dataset.count || "0");
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (reduce) {
    el.textContent = `${prefix}${target}${suffix}`;
    return;
  }
  const dur = 1200;
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if (counters.length && "IntersectionObserver" in window) {
  const cObs = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          animateCount(e.target as HTMLElement);
          obs.unobserve(e.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((c) => cObs.observe(c));
} else {
  counters.forEach((c) => animateCount(c));
}

/* ---------- Brillo que sigue al cursor (tarjetas de features, v1) ----------
   Optimizado: el rect se cachea al entrar (sin getBoundingClientRect por
   movimiento = sin reflujo forzado) y la escritura se agrupa en un rAF. */
if (!reduce && window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll<HTMLElement>("[data-glow]").forEach((card) => {
    let rect: DOMRect | null = null;
    let mx = 0;
    let my = 0;
    let queued = false;
    const apply = () => {
      queued = false;
      card.style.setProperty("--mx", `${mx}px`);
      card.style.setProperty("--my", `${my}px`);
    };
    card.addEventListener("pointerenter", () => {
      rect = card.getBoundingClientRect();
    });
    card.addEventListener("pointermove", (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      if (!queued) {
        queued = true;
        requestAnimationFrame(apply);
      }
    });
  });
}

/* ---------- Nav: transparente arriba, glass (blur) al hacer scroll ---------- */
const nav = document.querySelector<HTMLElement>("[data-nav]");
if (nav) {
  let navTicking = false;
  const updateNav = () => {
    navTicking = false;
    nav.toggleAttribute("data-scrolled", window.scrollY > 24);
  };
  updateNav();
  window.addEventListener(
    "scroll",
    () => {
      if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(updateNav);
      }
    },
    { passive: true },
  );
}

/* ---------- Toggle de idioma ---------- */
function setLang(lang: "es" | "en") {
  const el = document.documentElement;
  el.setAttribute("data-lang", lang);
  el.setAttribute("lang", lang);
  const meta = window.__spI18n?.[lang];
  if (meta) {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.desc);
  }
  try {
    localStorage.setItem("sp-lang", lang);
  } catch {
    /* noop */
  }
  document.querySelectorAll<HTMLElement>("[data-lang-label]").forEach((b) => {
    b.textContent = lang === "es" ? "EN" : "ES";
  });
}

// Etiqueta inicial del botón
const current = (document.documentElement.getAttribute("data-lang") as "es" | "en") || "es";
document.querySelectorAll<HTMLElement>("[data-lang-label]").forEach((b) => {
  b.textContent = current === "es" ? "EN" : "ES";
});

document.querySelectorAll<HTMLElement>("[data-lang-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-lang") === "es" ? "en" : "es";
    setLang(next);
    track("lang/" + next, "Cambio de idioma a " + next);
  });
});

/* ---------- Menú móvil ---------- */
const burger = document.querySelector<HTMLButtonElement>("[data-burger]");
const mobileMenu = document.querySelector<HTMLElement>("[data-mobile-menu]");
if (burger && mobileMenu) {
  burger.addEventListener("click", () => {
    const open = mobileMenu.toggleAttribute("data-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.removeAttribute("data-open");
      burger.setAttribute("aria-expanded", "false");
    }),
  );
}

/* ---------- Analítica de clics ---------- */
document.querySelectorAll<HTMLElement>("[data-download]").forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.download || "app";
    track("download/" + k, "Click descargar: " + k);
  }),
);
document.querySelectorAll<HTMLElement>("[data-github]").forEach((b) =>
  b.addEventListener("click", () => track("github", "Click GitHub")),
);
document.querySelectorAll<HTMLElement>("[data-donate]").forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.donate || "";
    track("donate/" + k, "Click donar: " + k);
  }),
);

/* ---------- Navegación: qué secciones llega a ver el usuario ----------
   Cada sección con id se registra UNA vez al entrar en viewport → evento
   section/<id>. Alimenta el funnel y el mapa de "hasta dónde llegan". */
const sections = document.querySelectorAll<HTMLElement>("main section[id]");
if (sections.length && "IntersectionObserver" in window) {
  const seen = new Set<string>();
  const secObs = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).id;
        if (e.isIntersecting && id && !seen.has(id)) {
          seen.add(id);
          track("section/" + id, "Vio la sección: " + id);
          obs.unobserve(e.target);
        }
      }
    },
    { threshold: 0.4 },
  );
  sections.forEach((s) => secObs.observe(s));
}

/* ---------- Profundidad de scroll (25/50/75/100%), una vez cada hito ---------- */
{
  const marks = [25, 50, 75, 100];
  const fired = new Set<number>();
  let scrollQueued = false;
  const checkDepth = () => {
    scrollQueued = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    if (max <= 0) return;
    const pct = (doc.scrollTop / max) * 100;
    for (const m of marks) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        track("scroll/" + m, "Scroll " + m + "%");
      }
    }
    if (fired.size === marks.length) {
      window.removeEventListener("scroll", onScroll);
    }
  };
  const onScroll = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(checkDepth);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Badge de versión (API de GitHub) ---------- */
const badge = document.querySelector<HTMLElement>("[data-release-tag]");
if (badge) {
  fetch("https://api.github.com/repos/gepres/screenpencil-releases/releases/latest")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.tag_name) badge.textContent = d.tag_name;
    })
    .catch(() => {
      /* deja el valor por defecto */
    });
}

export {};
