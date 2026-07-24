/**
 * Color-space conversions.
 *
 * Uses perceptually uniform spaces (Lab / LCH) for Garau's visual-mixture
 * logic, and sRGB / ITU-R BT.709 luminance for Metelli's lightness conditions.
 * Ported from `reference/python-engine/color_engine/conversions.py`.
 */

import type { RGB, NormalizedRGB, HSL, Lab, LCH } from './types.js';

const clamp = (v: number, min = 0, max = 1): number => Math.max(min, Math.min(max, v));

/** Clamp + round an RGB triple into a valid 0–255 integer color. */
export function rgb(r: number, g: number, b: number): RGB {
  return {
    r: Math.round(clamp(r, 0, 255)),
    g: Math.round(clamp(g, 0, 255)),
    b: Math.round(clamp(b, 0, 255)),
  };
}

export function rgbToNormalized(c: RGB): NormalizedRGB {
  return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
}

export function normalizedToRgb(c: NormalizedRGB): RGB {
  return rgb(c.r * 255, c.g * 255, c.b * 255);
}

export function rgbToHsl(c: RGB): HSL {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const l = (maxC + minC) / 2;

  let h = 0;
  let s = 0;
  if (maxC !== minC) {
    const d = maxC - minC;
    s = l > 0.5 ? d / (2 - maxC - minC) : d / (maxC + minC);
    if (maxC === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (maxC === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) return rgb(l * 255, l * 255, l * 255);

  const hueToRgb = (p: number, q: number, tIn: number): number => {
    let t = tIn;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return rgb(
    hueToRgb(p, q, h + 1 / 3) * 255,
    hueToRgb(p, q, h) * 255,
    hueToRgb(p, q, h - 1 / 3) * 255,
  );
}

const gammaToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const linearToGamma = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

// D65 reference white.
const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

export function rgbToLab(c: RGB): Lab {
  const r = gammaToLinear(c.r / 255);
  const g = gammaToLinear(c.g / 255);
  const b = gammaToLinear(c.b / 255);

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  const f = (tv: number): number => (tv > 0.008856 ? Math.cbrt(tv) : 7.787 * tv + 16 / 116);
  const fy = f(y / Yn);
  return {
    l: Math.max(0, 116 * fy - 16),
    a: 500 * (f(x / Xn) - fy),
    b: 200 * (fy - f(z / Zn)),
  };
}

export function labToRgb(lab: Lab): RGB {
  const fInv = (tv: number): number => (tv > 0.20689303442296383 ? tv ** 3 : (tv - 16 / 116) / 7.787);
  const fy = (lab.l + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;

  const x = Xn * fInv(fx);
  const y = Yn * fInv(fy);
  const z = Zn * fInv(fz);

  const r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return rgb(linearToGamma(r) * 255, linearToGamma(g) * 255, linearToGamma(b) * 255);
}

export function rgbToLch(c: RGB): LCH {
  const { l, a, b } = rgbToLab(c);
  const chroma = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  h = ((h % 360) + 360) % 360;
  return { l, c: chroma, h };
}

export function lchToRgb(lch: LCH): RGB {
  const hRad = (lch.h * Math.PI) / 180;
  return labToRgb({ l: lch.l, a: lch.c * Math.cos(hRad), b: lch.c * Math.sin(hRad) });
}

export function rgbToHex(c: RGB): string {
  const h = (n: number): string => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

export function hexToRgb(hex: string): RGB {
  const s = hex.replace(/^#/, '');
  const expanded = s.length === 3 ? s.split('').map((ch) => ch + ch).join('') : s;
  return rgb(
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  );
}

/** Interpolate two RGB colors in perceptual LCH space (shortest hue path). */
export function interpolateRgb(c1: RGB, c2: RGB, t: number): RGB {
  const a = rgbToLch(c1);
  const b = rgbToLch(c2);
  const l = a.l + t * (b.l - a.l);
  const c = a.c + t * (b.c - a.c);
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const h = ((a.h + t * dh) % 360 + 360) % 360;
  return lchToRgb({ l, c, h });
}

/** Relative luminance (ITU-R BT.709), 0–1. */
export function getLuminance(c: RGB): number {
  const r = gammaToLinear(c.r / 255);
  const g = gammaToLinear(c.g / 255);
  const b = gammaToLinear(c.b / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1:1 to 21:1). */
export function getContrastRatio(c1: RGB, c2: RGB): number {
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
