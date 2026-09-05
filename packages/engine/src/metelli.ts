/**
 * Metelli's equations for perceptual transparency, extended per-channel to RGB
 * (following Da Pos, refined by Garau's visual-mixture thesis).
 *
 *   P_c = α·A_c + (1−α)·t_c     (overlap of figure over background A)
 *   Q_c = α·B_c + (1−α)·t_c     (overlap of figure over background B)
 *
 * Ported from `reference/python-engine/color_engine/metelli.py`.
 */

import type { RGB, LCH, MetelliResult } from './types.js';
import {
  rgbToNormalized,
  normalizedToRgb,
  rgbToLch,
  lchToRgb,
} from './conversions.js';
import { checkMetelliConditions } from './metelliConditions.js';

const clamp = (v: number, min = 0, max = 1): number => Math.max(min, Math.min(max, v));

const channels = (c: RGB): [number, number, number] => {
  const n = rgbToNormalized(c);
  return [n.r, n.g, n.b];
};

/** α for a single channel: α = (P − Q) / (A − B). Null if A ≈ B. */
function alphaChannel(P: number, Q: number, A: number, B: number): number | null {
  const denom = A - B;
  if (Math.abs(denom) < 1e-10) return null;
  return clamp((P - Q) / denom);
}

/** t for a single channel: t_c = (P_c − α·A_c) / (1 − α). */
function tChannel(P: number, A: number, alpha: number): number {
  if (Math.abs(1 - alpha) < 1e-10) return P; // fully opaque → t irrelevant
  return clamp((P - alpha * A) / (1 - alpha));
}

/** Overlap for a single channel: P_c = α·A_c + (1 − α)·t_c. */
function overlapChannel(A: number, t: number, alpha: number): number {
  return clamp(alpha * A + (1 - alpha) * t);
}

/**
 * Composite a transparent veil (color t, coefficient α) over a single base
 * color, per channel: result = α·base + (1−α)·t. This is one overlap of the
 * Metelli model, and — because it runs in sRGB — it matches the "source-over"
 * alpha compositing a renderer performs for a veil drawn at opacity (1−α).
 * Stacking veils is repeated application of this operation.
 */
export function compositeVeil(base: RGB, t: RGB, alpha: number): RGB {
  const [br, bg, bb] = channels(base);
  const [tr, tg, tb] = channels(t);
  return normalizedToRgb({
    r: overlapChannel(br, tr, alpha),
    g: overlapChannel(bg, tg, alpha),
    b: overlapChannel(bb, tb, alpha),
  });
}

/**
 * Forward mode — the primary creative direction.
 * Given backgrounds A, B, a transparent color t, and α, compute overlaps P, Q.
 */
export function computeForward(A: RGB, B: RGB, t: RGB, alpha: number): MetelliResult {
  const [ar, ag, ab] = channels(A);
  const [br, bg, bb] = channels(B);
  const [tr, tg, tb] = channels(t);

  const P = normalizedToRgb({
    r: overlapChannel(ar, tr, alpha),
    g: overlapChannel(ag, tg, alpha),
    b: overlapChannel(ab, tb, alpha),
  });
  const Q = normalizedToRgb({
    r: overlapChannel(br, tr, alpha),
    g: overlapChannel(bg, tg, alpha),
    b: overlapChannel(bb, tb, alpha),
  });

  const warnings: string[] = [];
  let valid = true;

  if (alpha < 0 || alpha > 1) {
    warnings.push(`Alpha ${alpha} is outside valid range [0, 1]`);
    valid = false;
  }
  if (alpha < 0.05) warnings.push('Very low alpha — transparency effect may be imperceptible');
  else if (alpha > 0.95) warnings.push('Very high alpha — figure may appear opaque');

  // Metelli's three conditions, from the single shared implementation. α is an
  // input here and already covered by the two range warnings above, so the
  // scission warning would only restate them.
  const conditions = checkMetelliConditions(A, B, P, Q, alpha);
  warnings.push(...conditions.warnings.filter((w) => !w.startsWith('Scission not realizable')));

  return { P, Q, t, alpha, valid: valid && warnings.length === 0, warnings };
}

/**
 * Inverse mode — analyze an existing four-zone display.
 * Given backgrounds A, B and overlaps P, Q, recover t and α.
 */
export function computeInverse(A: RGB, B: RGB, P: RGB, Q: RGB, tolerance = 0.1): MetelliResult {
  const [ar, ag, ab] = channels(A);
  const [br, bg, bb] = channels(B);
  const [pr, pg, pb] = channels(P);
  const [qr, qg, qb] = channels(Q);

  const alphas = [
    alphaChannel(pr, qr, ar, br),
    alphaChannel(pg, qg, ag, bg),
    alphaChannel(pb, qb, ab, bb),
  ].filter((a): a is number => a !== null);

  const warnings: string[] = [];
  let valid = true;
  let alpha: number;

  if (alphas.length === 0) {
    warnings.push('Cannot compute alpha: backgrounds are identical');
    alpha = 0.5;
    valid = false;
  } else {
    const mean = alphas.reduce((s, a) => s + a, 0) / alphas.length;
    alpha = mean;
    const variance = alphas.reduce((s, a) => s + (a - mean) ** 2, 0) / alphas.length;
    if (variance > tolerance ** 2) {
      warnings.push(
        `Alpha inconsistency across channels (variance=${variance.toFixed(4)}). ` +
          'This may not be a valid balanced transparency.',
      );
      valid = false;
    }
  }

  const t = normalizedToRgb({
    r: tChannel(pr, ar, alpha),
    g: tChannel(pg, ag, alpha),
    b: tChannel(pb, ab, alpha),
  });

  if (alpha < 0 || alpha > 1) {
    warnings.push(`Computed alpha ${alpha.toFixed(3)} is outside valid range [0, 1]`);
    valid = false;
  }

  // Metelli's three conditions, from the single shared implementation. The
  // identical-backgrounds case is already reported above in this function's own
  // vocabulary, so its duplicate is dropped here.
  const conditions = checkMetelliConditions(A, B, P, Q, alpha);
  warnings.push(...conditions.warnings.filter((w) => !w.includes('(near) identical')));

  return { P, Q, t, alpha, valid: valid && warnings.length === 0, warnings };
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
  const weights = [0.2126, 0.7152, 0.0722];

  const perChannel: Array<[number, number, number, number, number]> = [
    [pr, qr, ar, br, weights[0]!],
    [pg, qg, ag, bg, weights[1]!],
    [pb, qb, ab, bb, weights[2]!],
  ];

  let weightedSum = 0;
  let totalWeight = 0;
  for (const [p, q, a, b, w] of perChannel) {
    const alpha = alphaChannel(p, q, a, b);
    const channelDiff = Math.abs(a - b);
    if (alpha !== null && channelDiff > 0.01) {
      const weight = w * channelDiff;
      weightedSum += alpha * weight;
      totalWeight += weight;
    }
  }
  return totalWeight === 0 ? 0.5 : clamp(weightedSum / totalWeight);
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
