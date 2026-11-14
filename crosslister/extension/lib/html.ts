// Tiny helpers for building extension pages without a UI framework.

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

export const dollars = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2));

export function toCents(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t.replace(/[$,]/g, ''));
  if (!Number.isFinite(n) || n < 0) throw new Error(`not a price: ${text}`);
  return Math.round(n * 100);
}
