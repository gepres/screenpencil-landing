/* Selectores DOM y formateadores compartidos del panel. Sin estado. */

export const $ = <T extends Element = HTMLElement>(s: string): T | null => document.querySelector<T>(s);

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export const num = (n: unknown): string => Number(n ?? 0).toLocaleString("es-PE");

export const fmtShort = (n: number): string => {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
  return String(n);
};

export const pct = (n: number, d: number): number => (d ? Math.round((n / d) * 100) : 0);

export const avg = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/** Bandera emoji desde código ISO 3166-1 alpha-2 ("PE" → 🇵🇪). */
export const flag = (code?: string): string => {
  const cc = (code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) + " ";
};

/** Serializa filas a CSV (escapa comillas, comas, `;` y saltos de línea). */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => {
    const s = String(c ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}
