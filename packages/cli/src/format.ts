/**
 * Rendering helpers for the human-readable output. Every function returns a
 * new string; nothing here writes to a stream.
 */

import type { RGB, GarauMixture } from '@garau/engine';
import { rgbToHex, analyzeVisualMixture } from '@garau/engine';

const ESC = '\u001b';
const RESET = `${ESC}[0m`;
const DIM = `${ESC}[2m`;

export interface ColorInfo {
  readonly hex: string;
  readonly rgb: RGB;
}

/** The shape every colour takes in `--json` output. */
export const colorInfo = (c: RGB): ColorInfo => ({
  hex: rgbToHex(c),
  rgb: { r: c.r, g: c.g, b: c.b },
});

/** A solid block of the colour itself, or nothing when colour is off. */
export const chip = (c: RGB, color: boolean): string =>
  color ? `${ESC}[48;2;${c.r};${c.g};${c.b}m   ${RESET} ` : '';

export const dim = (text: string, color: boolean): string => (color ? `${DIM}${text}${RESET}` : text);

/** `  A      #3A6EA5  rgb(58, 110, 165)  yB` */
export function swatch(label: string, c: RGB, color: boolean, note = ''): string {
  const rgbText = `rgb(${c.r}, ${c.g}, ${c.b})`;
  const tail = note === '' ? '' : `  ${note}`;
  return `  ${label.padEnd(7)}${chip(c, color)}${rgbToHex(c).padEnd(9)} ${rgbText.padEnd(20)}${tail}`;
}

/** A swatch line already annotated with the colour's Garau notation. */
export const swatchWithNotation = (label: string, c: RGB, color: boolean): string =>
  swatch(label, c, color, analyzeVisualMixture(c).notation);

export const heading = (text: string, color: boolean): string => `\n${dim(text, color)}`;

export const kv = (label: string, value: string, width = 22): string => `  ${label.padEnd(width)}${value}`;

export const bullets = (items: readonly string[]): readonly string[] => items.map((i) => `  - ${i}`);

/** Yes / no / not-applicable for a tri-state condition. */
export const mark = (value: boolean | null): string => (value === null ? '-' : value ? 'yes' : 'NO');

export const percent = (value: number): string => `${(value * 100).toFixed(0)}%`;

export const score = (value: number): string => `${value.toFixed(0)}/100`;

/** The reading of a single colour shared by `analyze` and `convert`. */
export function mixtureLines(m: GarauMixture): readonly string[] {
  return [
    kv('Notation', m.notation),
    kv('Dominant', m.dominant),
    kv('Subordinate', m.subordinate ?? 'none'),
    kv('Ratio', m.ratio.toFixed(3)),
    kv(
      'Hue / sat / light',
      `${m.hueAngle.toFixed(1)} deg / ${m.saturation.toFixed(1)} / ${m.lightness.toFixed(1)}`,
    ),
    kv('Pure primary', mark(m.isPure)),
    kv('Balanced mixture', mark(m.isBalanced)),
    kv('Splittability', m.splittability.toFixed(3)),
  ];
}
