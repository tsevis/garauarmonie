/**
 * Visual Mixture System — Garau's central thesis.
 *
 * Transparency perception depends on *visual* chromatic mixtures, not physical
 * ones. Any color is decomposed into a dominant primary (R, Y, or B) and an
 * optional subordinate, with a mixture ratio and Garau notation (e.g. "rB").
 * Pairs of colours are classified in `juxtaposition.ts`.
 *
 * Ported from `reference/python-engine/color_engine/visual_mixture.py`.
 */

import type { RGB, DominantPrimary, GarauMixture } from './types.js';
import { rgbToHsl, hexToRgb } from './conversions.js';
import { rgbToOklch, oklchToRgb } from './oklab.js';

// Garau reads colour on the yellow-red-blue disk of the painters (Klee, Itten),
// with R, Y and B 120 degrees apart and each secondary halfway between two
// primaries. Hue is read in OKLCH, which is close to perceptually even, and
// mapped piecewise onto that disk through Garau's own twelve colours: the
// principals sampled from the cover of Le armonie del colore (1984), the
// tertiaries between them, with yellow the lightest, violet the darkest and
// every step down either side equal in hue and lightness.
export interface GarauCircleColour {
  readonly notation: string;
  readonly hex: string;
  /** Place on the RYB disk: R = 0, Y = 120, B = 240. */
  readonly ryb: number;
}

export const GARAU_CIRCLE: readonly GarauCircleColour[] = [
  { notation: 'R', hex: '#C84650', ryb: 0 },
  { notation: 'yR', hex: '#ED5D2F', ryb: 30 },
  { notation: 'RY', hex: '#F9892C', ryb: 60 },
  { notation: 'rY', hex: '#FFB33B', ryb: 90 },
  { notation: 'Y', hex: '#FFDC56', ryb: 120 },
  { notation: 'bY', hex: '#C0CE69', ryb: 150 },
  { notation: 'YB', hex: '#84BB81', ryb: 180 },
  { notation: 'yB', hex: '#5AA097', ryb: 210 },
  { notation: 'B', hex: '#567F9A', ryb: 240 },
  { notation: 'rB', hex: '#5E5C8A', ryb: 270 },
  { notation: 'BR', hex: '#623D5D', ryb: 300 },
  { notation: 'bR', hex: '#95435D', ryb: 330 },
];

const PRIMARY_RYB: Record<DominantPrimary, number> = { R: 0, Y: 120, B: 240 };
// Balanced secondaries, written in one fixed order.
const SECONDARY_NOTATION: Record<string, string> = { RY: 'RY', YR: 'RY', YB: 'YB', BY: 'YB', BR: 'BR', RB: 'BR' };

/**
 * Subordinate share below which a colour reads as a pure primary. On the RYB
 * disk this is 12 degrees from the primary; a 2:1 tertiary sits at 1/3.
 */
const PURE_RATIO = 0.1;

/** Below this OKLCH chroma a colour reads as grey: no hue to split. */
export const ACHROMATIC_CHROMA = 0.025;

const ANCHOR_HUES: ReadonlyArray<readonly [oklchHue: number, rybAngle: number]> = GARAU_CIRCLE.map(
  ({ hex, ryb }) => [rgbToOklch(hexToRgb(hex)).h, ryb] as const,
);

export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

export function hueDistance(h1: number, h2: number): number {
  const a = normalizeHue(h1);
  const b = normalizeHue(h2);
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

/** Map an OKLCH hue onto the RYB disk (R = 0, Y = 120, B = 240). */
export function oklchHueToRyb(hue: number): number {
  const h = normalizeHue(hue);
  for (let i = 0; i < ANCHOR_HUES.length; i++) {
    const [h0, a0] = ANCHOR_HUES[i]!;
    const [h1, a1] = ANCHOR_HUES[(i + 1) % ANCHOR_HUES.length]!;
    const span = normalizeHue(h1 - h0);
    const offset = normalizeHue(h - h0);
    if (offset <= span) {
      const arc = normalizeHue(a1 - a0) || 360;
      return normalizeHue(a0 + (offset / span) * arc);
    }
  }
  return 0; // unreachable: the anchors close the circle
}

interface RybReading {
  readonly dominant: DominantPrimary;
  readonly subordinate: DominantPrimary | null;
  /** Share of the subordinate: 0 = pure, 0.5 = balanced. */
  readonly ratio: number;
}

/** Dominant = nearest primary on the disk; subordinate = the side the hue lies on. */
function readRyb(rybAngle: number): RybReading {
  const primaries = Object.keys(PRIMARY_RYB) as DominantPrimary[];
  let dominant = primaries[0]!;
  let signed = Infinity;
  for (const p of primaries) {
    const d = ((rybAngle - PRIMARY_RYB[p] + 540) % 360) - 180;
    if (Math.abs(d) < Math.abs(signed)) {
      signed = d;
      dominant = p;
    }
  }
  if (Math.abs(signed) < 1e-9) return { dominant, subordinate: null, ratio: 0 };
  const towards = normalizeHue(PRIMARY_RYB[dominant] + Math.sign(signed) * 120);
  const subordinate = primaries.find((p) => PRIMARY_RYB[p] === towards) ?? null;
  return { dominant, subordinate, ratio: Math.min(0.5, Math.abs(signed) / 120) };
}

function garauNotation(
  dominant: DominantPrimary,
  subordinate: DominantPrimary | null,
  ratio: number,
): string {
  if (subordinate === null || ratio < PURE_RATIO) return dominant;
  if (ratio >= 0.4 && ratio <= 0.6) return SECONDARY_NOTATION[`${dominant}${subordinate}`]!; // balanced
  if (ratio < 0.5) return `${subordinate.toLowerCase()}${dominant}`; // subordinate prefix
  return `${dominant.toLowerCase()}${subordinate}`; // inverted
}

const isPure = (subordinate: DominantPrimary | null, ratio: number): boolean =>
  subordinate === null || ratio < PURE_RATIO;

const isBalanced = (ratio: number): boolean => ratio >= 0.4 && ratio <= 0.6;

function splittability(subordinate: DominantPrimary | null, ratio: number): number {
  if (isPure(subordinate, ratio)) return 0;
  if (isBalanced(ratio)) return 0.3; // green / orange / violet resist splitting
  return 0.7 + 0.3 * Math.abs(0.5 - ratio) * 2;
}

/** Analyze a color as a visual mixture in Garau's framework. */
export function analyzeVisualMixture(color: RGB): GarauMixture {
  const hsl = rgbToHsl(color);
  const oklch = rgbToOklch(color);
  const base = { hueAngle: hsl.h, saturation: hsl.s, lightness: hsl.l };

  if (oklch.C < ACHROMATIC_CHROMA) {
    // Garau: an achromatic colour cannot be split into chromatic hues.
    return {
      ...base,
      dominant: readRyb(oklchHueToRyb(oklch.h)).dominant,
      subordinate: null,
      ratio: 0,
      notation: 'N',
      isAchromatic: true,
      isPure: false,
      isBalanced: false,
      splittability: 0,
    };
  }

  const { dominant, subordinate, ratio } = readRyb(oklchHueToRyb(oklch.h));
  return {
    ...base,
    dominant,
    subordinate,
    ratio,
    notation: garauNotation(dominant, subordinate, ratio),
    isAchromatic: false,
    isPure: isPure(subordinate, ratio),
    isBalanced: isBalanced(ratio),
    splittability: splittability(subordinate, ratio),
  };
}

/** A tertiary: an unbalanced two-primary mixture, the only colours the four juxtapositions relate. */
export const isTertiary = (m: GarauMixture): boolean => !m.isAchromatic && !m.isPure && !m.isBalanced;

/** The primaries a colour visibly contains: none if grey, one if pure, else two. */
export function mixtureComponents(m: GarauMixture): readonly DominantPrimary[] {
  if (m.isAchromatic) return [];
  if (m.isPure || m.subordinate === null) return [m.dominant];
  return [m.dominant, m.subordinate];
}

/**
 * Complementary mixture: the colour opposite on Garau's disk, as far from the
 * grey centre as the input. A colour of his circle gets the circle colour
 * across from it (yR -> yB, Y -> BR).
 */
export function getComplementaryMixture(color: RGB): RGB {
  const { ryb, radius } = garauDiskPlace(color);
  return garauDiskColour(ryb + 180, radius);
}

const CIRCLE_STEP = 360 / GARAU_CIRCLE.length;
const CIRCLE_OKLCH = GARAU_CIRCLE.map(({ hex }) => rgbToOklch(hexToRgb(hex)));

/** Lightness and chroma of Garau's circle at a place of the RYB disk, blended between the two nearest colours. */
function circleAt(rybAngle: number): { L: number; C: number } {
  const a = normalizeHue(rybAngle) / CIRCLE_STEP;
  const i = Math.floor(a) % GARAU_CIRCLE.length;
  const t = a - Math.floor(a);
  const p = CIRCLE_OKLCH[i]!;
  const q = CIRCLE_OKLCH[(i + 1) % GARAU_CIRCLE.length]!;
  return { L: p.L + t * (q.L - p.L), C: p.C + t * (q.C - p.C) };
}

/** Where a colour sits on Garau's disk: its RYB angle, and its chroma as a fraction of the circle's there (0 grey, 1 rim). */
export function garauDiskPlace(color: RGB): { ryb: number; radius: number } {
  const o = rgbToOklch(color);
  if (o.C < ACHROMATIC_CHROMA) return { ryb: 0, radius: 0 };
  const ryb = oklchHueToRyb(o.h);
  return { ryb, radius: Math.min(1, o.C / circleAt(ryb).C) };
}

/** The colour at a place of Garau's disk: his circle at the rim, fading to grey toward the centre. */
export function garauDiskColour(rybAngle: number, radius: number): RGB {
  const { L, C } = circleAt(rybAngle);
  return oklchToRgb({ L, C: Math.max(0, Math.min(1, radius)) * C, h: rybToOklchHue(rybAngle) });
}

/** Inverse of `oklchHueToRyb`: the OKLCH hue at a point of the RYB disk. */
export function rybToOklchHue(rybAngle: number): number {
  const a = normalizeHue(rybAngle);
  for (let i = 0; i < ANCHOR_HUES.length; i++) {
    const [h0, a0] = ANCHOR_HUES[i]!;
    const [h1, a1] = ANCHOR_HUES[(i + 1) % ANCHOR_HUES.length]!;
    const arc = normalizeHue(a1 - a0) || 360;
    const offset = normalizeHue(a - a0);
    if (offset <= arc) return normalizeHue(h0 + (offset / arc) * normalizeHue(h1 - h0));
  }
  return 0; // unreachable: the anchors close the circle
}

/**
 * Find a color forming a shared-subordinate juxtaposition with the input:
 * the input's place on Garau's disk mirrored across its subordinate primary
 * (yR -> yB, bR -> bY), as far from the grey centre as the input.
 */
export function findSharedSubordinatePartner(color: RGB): RGB {
  const mixture = analyzeVisualMixture(color);
  const { ryb, radius } = garauDiskPlace(color);
  const mirror =
    mixture.subordinate === null
      ? ryb + 60 // a pure primary has no subordinate to share; step to a neighbour
      : 2 * PRIMARY_RYB[mixture.subordinate] - ryb;
  return garauDiskColour(mirror, radius);
}
