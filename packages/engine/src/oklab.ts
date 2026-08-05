/**
 * OKLab / OKLCH (Björn Ottosson, "A perceptual color space for image
 * processing", 2020).
 *
 * Matrices are kept exactly as published, matching the numbers already in
 * Nino's `Sources/NinoCore/Color/OKLab.swift` — the two implementations
 * agree by construction rather than by re-derivation, the same way this
 * package's Lab/LCH already match culori/colorjs.io by using the published
 * constants rather than re-fit ones.
 *
 * OKLab is not used by Garau's own transparency/mixture maths (those stay
 * RGB-channel-shaped, per `metelli.ts`/`visualMixture.ts`) — it exists here
 * for `@garau/swatches`, which quantizes a perceptually uniform grid rather
 * than the uneven CIE Lab hue circle.
 */

import type { RGB, OKLab, OKLCH } from './types.js';
import { rgb } from './conversions.js';

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number): number => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/**
 * Chroma at or below which a colour is treated as having no hue at all —
 * matches `OKLab.neutralChromaFloor` in Nino. The published matrices are
 * rounded to ten decimals and do not sum to exactly zero, so a pure grey
 * carries ~4e-8 of numerical chroma; below this floor, report hue 0 rather
 * than the noise `atan2` would otherwise return.
 */
export const NEUTRAL_CHROMA_FLOOR = 1e-6;

/** The largest chroma the sRGB gamut reaches, near enough — matches `OKLCH.sRGBChromaCeiling`. */
export const SRGB_CHROMA_CEILING = 0.33;

/** sRGB 0–255 → OKLab, via linear-light RGB. */
export function rgbToOklab(c: RGB): OKLab {
  const r = toLinear(c.r / 255);
  const g = toLinear(c.g / 255);
  const b = toLinear(c.b / 255);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** OKLab → sRGB 0–255, rounded and clamped (see `isOklabInGamut` to test before clamping). */
export function oklabToRgb(c: OKLab): RGB {
  const l_ = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m_ = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s_ = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return rgb(fromLinear(r) * 255, fromLinear(g) * 255, fromLinear(b) * 255);
}

/** True when linear-light RGB (0–1, unclamped) all fall within [0, 1] — the sRGB gamut test proper. */
function isLinearInGamut(r: number, g: number, b: number): boolean {
  const tolerance = 1e-6;
  return (
    r >= -tolerance && r <= 1 + tolerance && g >= -tolerance && g <= 1 + tolerance && b >= -tolerance && b <= 1 + tolerance
  );
}

/** Whether an OKLab colour falls inside the sRGB gamut, before any clamping. */
export function isOklabInGamut(c: OKLab): boolean {
  const l_ = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m_ = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s_ = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return isLinearInGamut(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  );
}

export function oklabToOklch(c: OKLab): OKLCH {
  const chroma = Math.sqrt(c.a * c.a + c.b * c.b);
  if (chroma <= NEUTRAL_CHROMA_FLOOR) return { L: c.L, C: chroma, h: 0 };
  let h = (Math.atan2(c.b, c.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L: c.L, C: chroma, h };
}

export function oklchToOklab(c: OKLCH): OKLab {
  const radians = (c.h * Math.PI) / 180;
  return { L: c.L, a: c.C * Math.cos(radians), b: c.C * Math.sin(radians) };
}

export function rgbToOklch(c: RGB): OKLCH {
  return oklabToOklch(rgbToOklab(c));
}

export function oklchToRgb(c: OKLCH): RGB {
  return oklabToRgb(oklchToOklab(c));
}

/**
 * The largest chroma reachable in sRGB at a given lightness and hue, found
 * by binary search — the forward counterpart of Nino's `OKLCH.gamutMapped()`
 * (which reduces a *given* chroma down to the boundary; this instead finds
 * the boundary itself, which is what a swatch grid wants when it places
 * points as fractions of "as saturated as this lightness/hue can go").
 */
export function oklchMaxChroma(L: number, h: number, maxIterations = 24): number {
  if (!isOklabInGamut(oklchToOklab({ L, C: 0, h }))) return 0;
  let low = 0;
  let high = SRGB_CHROMA_CEILING * 1.5;
  for (let i = 0; i < maxIterations; i += 1) {
    const mid = (low + high) / 2;
    if (isOklabInGamut(oklchToOklab({ L, C: mid, h }))) low = mid;
    else high = mid;
  }
  return low;
}
