/**
 * Visual Mixture System — Garau's central thesis.
 *
 * Transparency perception depends on *visual* chromatic mixtures, not physical
 * ones. Any color is decomposed into a dominant primary (R, Y, or B) and an
 * optional subordinate, with a mixture ratio and Garau notation (e.g. "rB").
 * Color pairs are classified into Arnheim's four juxtaposition types.
 *
 * Ported from `reference/python-engine/color_engine/visual_mixture.py`.
 */

import type {
  RGB,
  LCH,
  DominantPrimary,
  GarauMixture,
  JuxtapositionType,
  HarmonyCategory,
  JuxtapositionAnalysis,
} from './types.js';
import { rgbToHsl, rgbToLch, lchToRgb } from './conversions.js';

// Garau's three primaries on the continuous hue circle.
const PRIMARY_HUES: Record<DominantPrimary, number> = { R: 0, Y: 60, B: 240 };
// Secondary (balanced) mixtures: RY = orange, YB = green, BR = violet.
const SECONDARY_HUES: Record<string, number> = { RY: 30, YB: 150, BR: 270 };

export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

export function hueDistance(h1: number, h2: number): number {
  const a = normalizeHue(h1);
  const b = normalizeHue(h2);
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function determineDominant(hue: number): DominantPrimary {
  const h = normalizeHue(hue);
  const primaries = Object.keys(PRIMARY_HUES) as DominantPrimary[];
  let best = primaries[0]!;
  let bestDist = Infinity;
  for (const p of primaries) {
    const d = hueDistance(h, PRIMARY_HUES[p]);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

function determineSubordinate(hue: number, dominant: DominantPrimary): DominantPrimary | null {
  const h = normalizeHue(hue);
  if (hueDistance(h, PRIMARY_HUES[dominant]) < 10) return null;

  const relevant = Object.entries(SECONDARY_HUES).filter(([name]) => name.includes(dominant));
  if (relevant.length === 0) return null;

  let closest = relevant[0]![0];
  let closestDist = Infinity;
  for (const [name, secHue] of relevant) {
    const d = hueDistance(h, secHue);
    if (d < closestDist) {
      closestDist = d;
      closest = name;
    }
  }
  for (const ch of closest) {
    if (ch !== dominant) return ch as DominantPrimary;
  }
  return null;
}

function mixtureRatio(
  hue: number,
  dominant: DominantPrimary,
  subordinate: DominantPrimary | null,
): number {
  if (subordinate === null) return 0;
  const h = normalizeHue(hue);
  const domHue = PRIMARY_HUES[dominant];
  const subHue = PRIMARY_HUES[subordinate];

  let secHue = (domHue + subHue) / 2;
  if (Math.abs(domHue - subHue) > 180) secHue = normalizeHue((domHue + subHue + 360) / 2);

  const distFromDom = hueDistance(h, domHue);
  const distToSec = hueDistance(h, secHue);
  const secToDom = hueDistance(secHue, domHue);
  const secToSub = hueDistance(secHue, subHue);

  let ratio: number;
  if (distFromDom <= secToDom) ratio = distFromDom / (2 * secToDom);
  else ratio = 0.5 + distToSec / (2 * secToSub);
  return Math.min(1, Math.max(0, ratio));
}

function garauNotation(
  dominant: DominantPrimary,
  subordinate: DominantPrimary | null,
  ratio: number,
): string {
  if (subordinate === null || ratio < 0.15) return dominant;
  if (ratio >= 0.4 && ratio <= 0.6) return `${dominant}${subordinate}`; // balanced
  if (ratio < 0.5) return `${subordinate.toLowerCase()}${dominant}`; // subordinate prefix
  return `${dominant.toLowerCase()}${subordinate}`; // inverted
}

const isPure = (subordinate: DominantPrimary | null, ratio: number): boolean =>
  subordinate === null || ratio < 0.15;

const isBalanced = (ratio: number): boolean => ratio >= 0.4 && ratio <= 0.6;

function splittability(subordinate: DominantPrimary | null, ratio: number): number {
  if (isPure(subordinate, ratio)) return 0;
  if (isBalanced(ratio)) return 0.3; // green / orange / violet resist splitting
  return 0.7 + 0.3 * Math.abs(0.5 - ratio) * 2;
}

/** Analyze a color as a visual mixture in Garau's framework. */
export function analyzeVisualMixture(color: RGB): GarauMixture {
  const hsl = rgbToHsl(color);
  const dominant = determineDominant(hsl.h);
  const subordinate = determineSubordinate(hsl.h, dominant);
  let ratio = mixtureRatio(hsl.h, dominant, subordinate);
  if (hsl.s < 20) ratio = 0.5; // desaturated colors approach neutral/balanced

  return {
    dominant,
    subordinate,
    ratio,
    notation: garauNotation(dominant, subordinate, ratio),
    hueAngle: hsl.h,
    saturation: hsl.s,
    lightness: hsl.l,
    isPure: isPure(subordinate, ratio),
    isBalanced: isBalanced(ratio),
    splittability: splittability(subordinate, ratio),
  };
}

// Garau's concord/discord grouping of the four juxtaposition types.
const HARMONY_BY_TYPE: Record<JuxtapositionType, Exclude<HarmonyCategory, 'Neutral'>> = {
  'Complete Inversion': 'Balanced concord',
  'Shared Subordinate': 'Balanced concord',
  'Shared Dominant': 'Unbalanced discord',
  'Partial Inversion': 'Unbalanced discord',
};

const HARMONY_NOTE: Record<JuxtapositionType, string> = {
  'Complete Inversion':
    'Both colours invert the same two primaries and resolve to one secondary — a close, balanced bond.',
  'Shared Subordinate':
    'Between them the pair holds all three primaries in equal weight — complementary, the strongest bond.',
  'Shared Dominant':
    'The shared dominant is pulled toward two different subordinates — tension and detachment.',
  'Partial Inversion':
    'All three primaries are present with one role inverted — an asymmetrical clash.',
};

function deriveHarmony(
  type: JuxtapositionType,
  m1: GarauMixture,
  m2: GarauMixture,
): { harmony: HarmonyCategory; harmonyNote: string } {
  // The concord/discord grouping describes pairs of tertiary mixtures. When a
  // color is a pure primary, that grouping does not apply.
  if (m1.isPure || m2.isPure) {
    return {
      harmony: 'Neutral',
      harmonyNote:
        'One colour reads as a pure primary; concord and discord describe pairs of tertiary mixtures.',
    };
  }
  return { harmony: HARMONY_BY_TYPE[type], harmonyNote: HARMONY_NOTE[type] };
}

/** Classify a color pair into one of Arnheim's four juxtaposition types. */
export function classifyJuxtaposition(c1: RGB, c2: RGB): JuxtapositionAnalysis {
  const m1 = analyzeVisualMixture(c1);
  const m2 = analyzeVisualMixture(c2);

  let type: JuxtapositionType;
  let description: string;
  let transparencyQuality: number;
  let recommendedCorrection: string | null = null;

  if (m1.subordinate !== null && m2.subordinate !== null &&
      m1.subordinate === m2.subordinate && m1.dominant !== m2.dominant) {
    type = 'Shared Subordinate';
    description =
      `Both colours share ${m1.subordinate} as subordinate; the dominants ${m1.dominant} and ` +
      `${m2.dominant} complete all three primaries, so the pair is complementary — a concord, and the most convincing veil.`;
    transparencyQuality = 85 + 15 * (1 - Math.abs(m1.ratio - m2.ratio));
  } else if (m1.dominant === m2.dominant && m1.subordinate !== m2.subordinate) {
    type = 'Shared Dominant';
    description =
      `Both colours share ${m1.dominant} as dominant; the differing subordinates ${m1.subordinate} and ` +
      `${m2.subordinate} pull the pair apart — a discordant tension, with the shared dominant carrying into the veil.`;
    transparencyQuality = 60 + 20 * (1 - Math.abs(m1.ratio - m2.ratio));
  } else if (m1.subordinate !== null && m2.subordinate !== null &&
             m1.dominant === m2.subordinate && m1.subordinate === m2.dominant) {
    type = 'Complete Inversion';
    description =
      `Complete inversion: ${m1.notation} and ${m2.notation} invert the same two primaries toward one ` +
      'secondary — closely bonded (a concord), though as overlaps the two shared colours converge.';
    transparencyQuality = 50;
    recommendedCorrection =
      'Adjust background colors to compensate for the inversion. ' +
      'Consider asymmetric correction (Garau condition 7).';
  } else if (m1.subordinate !== null && m2.subordinate !== null &&
             (m1.dominant === m2.subordinate || m1.subordinate === m2.dominant)) {
    type = 'Partial Inversion';
    description =
      `Partial inversion across all three primaries: ${m1.notation} and ${m2.notation} share one inverted ` +
      'role — a strong, discordant divergence that is the hardest to read as a veil.';
    transparencyQuality = 35;
    recommendedCorrection =
      'Carefully balance the background colors. Consider adjusting one color toward a ' +
      'complete or shared relationship.';
  } else {
    const hueDiff = hueDistance(m1.hueAngle, m2.hueAngle);
    if (hueDiff < 30) {
      type = 'Shared Dominant';
      description = `Colors are close in hue (${hueDiff.toFixed(1)}° apart). Treated as shared dominant.`;
      transparencyQuality = 55;
    } else if (hueDiff > 150) {
      type = 'Shared Subordinate';
      description = `Colors are nearly complementary (${hueDiff.toFixed(1)}° apart). Treated as shared subordinate.`;
      transparencyQuality = 70;
    } else {
      type = 'Partial Inversion';
      description = `Colors have a complex relationship (${hueDiff.toFixed(1)}° apart). No clear juxtaposition pattern.`;
      transparencyQuality = 40;
    }
  }

  const { harmony, harmonyNote } = deriveHarmony(type, m1, m2);

  return {
    type,
    harmony,
    harmonyNote,
    color1Mixture: m1,
    color2Mixture: m2,
    transparencyQuality: Math.min(100, Math.max(0, transparencyQuality)),
    description,
    recommendedCorrection,
  };
}

/** Complementary mixture: same subordinate, opposite hue — ideal shared-subordinate partner seed. */
export function getComplementaryMixture(color: RGB): RGB {
  const lch = rgbToLch(color);
  return lchToRgb({ l: lch.l, c: lch.c, h: (lch.h + 180) % 360 } as LCH);
}

/** Find a color forming a shared-subordinate juxtaposition with the input. */
export function findSharedSubordinatePartner(color: RGB): RGB {
  const lch = rgbToLch(color);
  const mixture = analyzeVisualMixture(color);

  if (mixture.subordinate === null) {
    return lchToRgb({ l: lch.l, c: lch.c * 0.8, h: (lch.h + 60) % 360 } as LCH);
  }
  const subHue = PRIMARY_HUES[mixture.subordinate];
  const domHue = PRIMARY_HUES[mixture.dominant];
  const partnerHue = normalizeHue(subHue + (subHue - domHue));
  return lchToRgb({ l: lch.l, c: lch.c, h: partnerHue } as LCH);
}
