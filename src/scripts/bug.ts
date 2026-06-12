/* Formulario de reporte de bugs (/bug) → EmailJS.
   sendForm() envía todos los campos con nombre y adjunta el <input type="file">
   automáticamente (si el plan/plantilla de EmailJS admite adjuntos). */
import emailjs from "@emailjs/browser";
import { emailjs as ejs } from "../data/site";

declare global {
  interface Window {
    goatcounter?: { count: (o: Record<string, unknown>) => void };
  }
}

const form = document.querySelector<HTMLFormElement>("[data-bug-form]");
const btn = document.querySelector<HTMLButtonElement>("[data-bug-submit]");
const btnLabel = document.querySelector<HTMLElement>("[data-bug-btn-label]");
const statusEl = document.querySelector<HTMLElement>("[data-bug-status]");

/** Texto según el idioma activo del documento. */
const lang = () => (document.documentElement.getAttribute("data-lang") === "en" ? "en" : "es");
const t = (es: string, en: string) => (lang() === "en" ? en : es);

function setStatus(msg: string, kind: "ok" | "err" | "info") {
  if (!statusEl) return;
  const map = {
    ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    err: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-white/12 bg-white/5 text-ink-soft",
  };
  statusEl.className = "rounded-xl border px-4 py-3 text-sm " + map[kind];
  statusEl.textContent = msg;
  statusEl.hidden = false;
  statusEl.classList.remove("hidden");
}

function val(name: string): string {
  return (form?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
}
function setVal(name: string, value: string) {
  const el = form?.elements.namedItem(name) as HTMLInputElement | null;
  if (el) el.value = value;
}

if (form && btn) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: si un bot rellena el campo oculto, fingimos éxito y no enviamos.
    if (val("_honey")) { setStatus(t("¡Gracias!", "Thanks!"), "ok"); form.reset(); return; }

    // Validación de la imagen (≤ 2 MB).
    const fileInput = form.elements.namedItem("bug_image") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (file && file.size > 2 * 1024 * 1024) {
      setStatus(t("La imagen supera 2 MB. Usa una más liviana.", "The image is over 2 MB. Please use a smaller one."), "err");
      return;
    }

    // Campos automáticos para la plantilla de EmailJS.
    const email = val("email");
    const title = val("title");
    setVal("reply_to", email);
    setVal("from_name", email || "Reporte de bug");
    setVal("subject", `[${val("type") || "Bug"}] ${title}`.slice(0, 150));
    setVal("browser", navigator.userAgent);
    setVal("page", location.href);
    setVal(
      "message",
      [
        `Tipo: ${val("type")}`,
        `Resumen: ${title}`,
        `Descripción:\n${val("description")}`,
        val("steps") ? `Pasos:\n${val("steps")}` : "",
        `Sistema: ${val("platform")} · Versión: ${val("version")}`,
        `Correo de contacto: ${email}`,
        `Navegador: ${navigator.userAgent}`,
      ].filter(Boolean).join("\n\n"),
    );

    // Envío.
    btn.disabled = true;
    const original = btnLabel?.textContent ?? "";
    if (btnLabel) btnLabel.textContent = t("Enviando…", "Sending…");
    setStatus(t("Enviando tu reporte…", "Sending your report…"), "info");
    try {
      await emailjs.sendForm(ejs.serviceId, ejs.templateId, form, { publicKey: ejs.publicKey });
      form.reset();
      setStatus(
        t(
          "✅ ¡Reporte enviado! Gracias por ayudarnos a mejorar ScreenPencil. Te responderemos a tu correo.",
          "✅ Report sent! Thanks for helping us improve ScreenPencil. We'll reply to your email.",
        ),
        "ok",
      );
      try { window.goatcounter?.count({ path: "bug/sent", title: "Reporte de bug enviado", event: true }); } catch {}
    } catch (err) {
      const detail = err instanceof Error ? err.message : (err as { text?: string })?.text || String(err);
      setStatus(
        t(
          "No se pudo enviar el reporte. Inténtalo de nuevo o abre un issue en GitHub. (" + detail + ")",
          "Couldn't send the report. Please try again or open a GitHub issue. (" + detail + ")",
        ),
        "err",
      );
    } finally {
      btn.disabled = false;
      if (btnLabel) btnLabel.textContent = original;
    }
  });
}
