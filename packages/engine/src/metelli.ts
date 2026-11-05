/**
 * Metelli's equations for perceptual transparency, extended per channel to RGB
 * (following Da Pos, refined by Garau's visual-mixture thesis).
 *
 *   P_c = α·A_c + (1−α)·t_c     (overlap of figure over background A)
 *   Q_c = α·B_c + (1−α)·t_c     (overlap of figure over background B)
 *
 * The model runs in linear light (linearised sRGB). α is Metelli's photometric
 * α — the open fraction of his episcotister, which by Talbot's law averages
 * light, not gamma-encoded values — so a 50% black veil over white gives
 * linear luminance 0.5. Da Pos likewise worked in tristimulus values. Colours
 * are converted back to sRGB only for display.
 *
 * Ported from `reference/python-engine/color_engine/metelli.py`.
 */

import type { RGB, LCH, MetelliResult } from './types.js';
import { rgbToLinear, linearToRgb, rgbToLch, lchToRgb } from './conversions.js';
import { checkMetelliConditions } from './metelliConditions.js';

const clamp = (v: number, min = 0, max = 1): number => Math.max(min, Math.min(max, v));

/** Da Pos: α must agree across the three channels within ±0.05. */
export const DA_POS_ALPHA_TOLERANCE = 0.05;
/** Below this α the veil is nearly opaque. */
const LOW_ALPHA = 0.05;
/** Above this α the veil barely shows. */
const HIGH_ALPHA = 0.95;
/** Background channels closer than this give no usable α estimate. */
const DEGENERATE = 1e-10;
/** α reported when the backgrounds are identical and α cannot be measured. */
const FALLBACK_ALPHA = 0.5;
/** Rec. 709 luminance weights of the linear R, G, B channels. */
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;
/** A channel whose backgrounds differ less than this does not vote on α. */
const MIN_CHANNEL_DIFF = 0.01;

type Triple = readonly [number, number, number];

const channels = (c: RGB): Triple => {
  const n = rgbToLinear(c);
  return [n.r, n.g, n.b];
};

const fromChannels = ([r, g, b]: Triple): RGB => linearToRgb({ r, g, b });

/** Build a channel triple from a per-channel function. */
const perChannel3 = (f: (i: 0 | 1 | 2) => number): Triple => [f(0), f(1), f(2)];

/** α for a single channel: α = (P − Q) / (A − B), unclamped. Null if A ≈ B. */
function alphaChannel(P: number, Q: number, A: number, B: number): number | null {
  const denom = A - B;
  if (Math.abs(denom) < DEGENERATE) return null;
  return (P - Q) / denom;
}

/** t for a single channel: t_c = (P_c − α·A_c) / (1 − α). */
function tChannel(P: number, A: number, alpha: number): number {
  if (Math.abs(1 - alpha) < DEGENERATE) return P; // fully opaque → t irrelevant
  return clamp((P - alpha * A) / (1 - alpha));
}

/** Overlap for a single channel: P_c = α·A_c + (1 − α)·t_c. */
function overlapChannel(A: number, t: number, alpha: number): number {
  return clamp(alpha * A + (1 - alpha) * t);
}

/** One overlap, in linear light: α·base + (1−α)·t per channel. */
function overlap(base: RGB, t: RGB, alpha: number): RGB {
  const b = channels(base);
  const v = channels(t);
  return fromChannels(perChannel3((i) => overlapChannel(b[i], v[i], alpha)));
}

/**
 * Composite a transparent veil (color t, coefficient α) over a single base
 * color: one overlap of the Metelli model, in linear light. Stacking veils is
 * repeated application of this operation. (A renderer's "source-over" at
 * opacity 1−α blends gamma-encoded values instead, so draw the returned colour
 * rather than a translucent veil.)
 */
export function compositeVeil(base: RGB, t: RGB, alpha: number): RGB {
  return overlap(base, t, alpha);
}

function alphaRangeWarnings(alpha: number): string[] {
  if (alpha < 0 || alpha > 1) return [`Alpha ${alpha} is outside valid range [0, 1]`];
  if (alpha < LOW_ALPHA) return ['Very low alpha — the veil is nearly opaque'];
  if (alpha > HIGH_ALPHA) return ['Very high alpha — the veil is barely visible'];
  return [];
}

/**
 * Forward mode — the primary creative direction.
 * Given backgrounds A, B, a transparent color t, and α, compute overlaps P, Q.
 */
export function computeForward(A: RGB, B: RGB, t: RGB, alpha: number): MetelliResult {
  const P = overlap(A, t, alpha);
  const Q = overlap(B, t, alpha);
  const valid = alpha >= 0 && alpha <= 1;

  // Metelli's three conditions, from the single shared implementation. α is an
  // input here and already covered by the range warnings, so the scission
  // warning would only restate them.
  const conditions = checkMetelliConditions(A, B, P, Q, alpha);
  const warnings = [
    ...alphaRangeWarnings(alpha),
    ...conditions.warnings.filter((w) => !w.startsWith('Scission not realizable')),
  ];
  return { P, Q, t, alpha, valid: valid && warnings.length === 0, warnings };
}

/** The mean channel α and the warnings its spread and range call for. */
function readAlpha(alphas: readonly number[], tolerance: number): { alpha: number; warnings: string[] } {
  if (alphas.length === 0) {
    return { alpha: FALLBACK_ALPHA, warnings: ['Cannot compute alpha: backgrounds are identical'] };
  }
  const alpha = alphas.reduce((s, a) => s + a, 0) / alphas.length;
  const spread = Math.max(...alphas.map((a) => Math.abs(a - alpha)));
  const warnings = [
    ...(spread > tolerance
      ? [
          `Alpha inconsistency across channels (largest deviation ${spread.toFixed(3)}, ` +
            `tolerance ±${tolerance}). This may not be a valid balanced transparency.`,
        ]
      : []),
    ...(alpha < 0 || alpha > 1 ? [`Computed alpha ${alpha.toFixed(3)} is outside valid range [0, 1]`] : []),
  ];
  return { alpha, warnings };
}

/**
 * Inverse mode — analyze an existing four-zone display.
 * Given backgrounds A, B and overlaps P, Q, recover t and α. Channel α are
 * averaged unclamped, so an impossible display reports α outside [0, 1].
 */
export function computeInverse(
  A: RGB,
  B: RGB,
  P: RGB,
  Q: RGB,
  tolerance = DA_POS_ALPHA_TOLERANCE,
): MetelliResult {
  const [a, b, p, q] = [channels(A), channels(B), channels(P), channels(Q)];
  const alphas = perChannel3((i) => alphaChannel(p[i], q[i], a[i], b[i]) ?? NaN).filter(
    (v) => !Number.isNaN(v),
  );
  const read = readAlpha(alphas, tolerance);
  const t = fromChannels(perChannel3((i) => tChannel(p[i], a[i], read.alpha)));

  // Metelli's three conditions, from the single shared implementation. The
  // identical-backgrounds case is already reported above in this function's own
  // vocabulary, so its duplicate is dropped here.
  const conditions = checkMetelliConditions(A, B, P, Q, read.alpha);
  const warnings = [...read.warnings, ...conditions.warnings.filter((w) => !w.includes('(near) identical'))];
  return { P, Q, t, alpha: read.alpha, valid: alphas.length > 0 && warnings.length === 0, warnings };
}

/**
 * Designer mode — sample the α range and return the forward result at each
 * step, so a designer can pick the α with the most compelling transparency.
 */
export function computeDesigner(
  A: RGB,
  B: RGB,
  t: RGB,
  alphaRange: readonly [number, number] = [0.2, 0.8],
  numSamples = 7,
): MetelliResult[] {
  let [min, max] = alphaRange;
  min = clamp(min);
  max = clamp(max);
  if (min >= max) [min, max] = [0.2, 0.8];

  const results: MetelliResult[] = [];
  const step = numSamples > 1 ? (max - min) / (numSamples - 1) : 0;
  for (let i = 0; i < numSamples; i += 1) {
    results.push(computeForward(A, B, t, min + step * i));
  }
  return results;
}

/**
 * Suggest α from a full four-zone configuration, luminance-weighting each
 * channel's estimate by how much the backgrounds differ on that channel.
 */
export function suggestTransparencyCoefficient(A: RGB, B: RGB, P: RGB, Q: RGB): number {
  const [ar, ag, ab] = channels(A);
  const [br, bg, bb] = channels(B);
  const [pr, pg, pb] = channels(P);
  const [qr, qg, qb] = channels(Q);
  const perChannel: Array<[number, number, number, number, number]> = [
    [pr, qr, ar, br, LUMINANCE_WEIGHTS[0]],
    [pg, qg, ag, bg, LUMINANCE_WEIGHTS[1]],
    [pb, qb, ab, bb, LUMINANCE_WEIGHTS[2]],
  ];

  let weightedSum = 0;
  let totalWeight = 0;
  for (const [p, q, a, b, w] of perChannel) {
    const alpha = alphaChannel(p, q, a, b);
    const channelDiff = Math.abs(a - b);
    if (alpha !== null && channelDiff > MIN_CHANNEL_DIFF) {
      const weight = w * channelDiff;
      weightedSum += alpha * weight;
      totalWeight += weight;
    }
  }
  return totalWeight === 0 ? FALLBACK_ALPHA : clamp(weightedSum / totalWeight);
}

/**
 * Suggest transparent-layer colors for two backgrounds, exploring around the
 * perceptual midpoint of A and B in LCH space.
 */
export function suggestTransparentColor(A: RGB, B: RGB): RGB[] {
  const a = rgbToLch(A);
  const b = rgbToLch(B);
  const avgL = (a.l + b.l) / 2;
  const avgC = (a.c + b.c) / 2;

  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const avgH = ((a.h + dh / 2) % 360 + 360) % 360;
  const compH = (avgH + 180) % 360;

  const make = (l: number, c: number, h: number): RGB => lchToRgb({ l, c, h } as LCH);
  return [
    make(avgL, avgC, avgH), // perceptual midpoint
    make(avgL, avgC * 0.7, compH), // complementary
    make(avgL, avgC * 0.4, avgH), // subtler
    make(avgL, Math.min(avgC * 1.5, 80), avgH), // more vivid
    make(Math.min(avgL + 20, 90), avgC * 0.6, avgH), // lighter
    make(Math.max(avgL - 20, 10), avgC * 0.6, avgH), // darker
  ];
}
