/**
 * The handful of DOM helpers every tab in this panel builds its UI from.
 * Split out once a second tab (Library) needed the same `el`/`css` the
 * Composer already had — no UXP framework is pulled in for two functions.
 */
import type { RGB } from '@garau/engine';

export const css = (c: RGB) => `rgb(${c.r}, ${c.g}, ${c.b})`;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string>> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
