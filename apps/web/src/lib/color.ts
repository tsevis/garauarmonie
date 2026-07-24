/** Thin view-layer helpers over @garau/engine. No color math lives here. */
import type { RGB } from '@garau/engine';
import { rgbToHsl, rgbToHex, getLuminance } from '@garau/engine';

export const rgbToCss = (c: RGB): string => `rgb(${c.r}, ${c.g}, ${c.b})`;
export const rgbToRgba = (c: RGB, a: number): string => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;

/** Black or white text that reads legibly on the given background. */
export function contrastText(c: RGB): string {
  return getLuminance(c) > 0.4 ? '#1F1D1A' : '#FBFAF8';
}

/** Compact multi-space readout string, e.g. for tooltips. */
export function colorReadout(c: RGB): { hex: string; rgb: string; hsl: string } {
  const hsl = rgbToHsl(c);
  return {
    hex: rgbToHex(c),
    rgb: `${c.r}, ${c.g}, ${c.b}`,
    hsl: `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`,
  };
}
