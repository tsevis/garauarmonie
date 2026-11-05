/**
 * Juxtaposition of two colours — Arnheim's four types and Garau's readings.
 *
 * The book defines the four juxtapositions only between two tertiaries
 * (unbalanced 2:1 mixtures, Color Harmonies chs. 2–5). Every other pair — a
 * grey, a pure primary, a balanced secondary — gets a plain relation instead,
 * with no type label and no transparency readout.
 *
 * For tertiary pairs the transparency reading is two separate readouts, as in
 * the book: the degree of transparency (condition 8, from the role of the
 * common colour) and the balance of the veil (condition 6, from the amount of
 * the common colour in each). The book ranks the types on neither one scale.
 */

import type {
  RGB,
  DominantPrimary,
  GarauMixture,
  JuxtapositionType,
  HarmonyCategory,
  JuxtapositionAnalysis,
  NonTertiaryRelation,
  NonTertiaryPair,
  TertiaryJuxtaposition,
  TransparencyDegree,
  BalanceReading,
} from './types.js';
import { analyzeVisualMixture, isTertiary, mixtureComponents } from './visualMixture.js';

/** The role a primary plays inside a mixture; in a balanced secondary it is neither. */
export type ColourRole = 'dominant' | 'subordinate' | 'balanced';

const PERCENT = 100;

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

const RELATION_NOTE: Record<NonTertiaryRelation, string> = {
  Achromatic: 'A grey, white or black has no hue to split, so no juxtaposition type applies.',
  'Two primaries': 'Two pure primaries: unmixed, they relate only as part of the triad.',
  Complementary:
    'A primary beside the balanced secondary of the other two primaries: plain complementarity.',
  'Primary and mixture':
    'A pure primary beside a mixture (the book’s chapter 1 case), not one of the four juxtapositions.',
  'Balanced secondary':
    'A balanced secondary resists splitting; the four juxtapositions relate two unbalanced tertiaries.',
  'Same mixture': 'Both colours read as the same tertiary; the four juxtapositions relate two different ones.',
};

/** The role `c` plays in `m`, or null when `m` does not contain it. */
export function roleOf(m: GarauMixture, c: DominantPrimary): ColourRole | null {
  if (!mixtureComponents(m).includes(c)) return null;
  if (m.isBalanced) return 'balanced';
  return m.dominant === c ? 'dominant' : 'subordinate';
}

/** The primaries both colours contain. */
export function sharedColours(m1: GarauMixture, m2: GarauMixture): readonly DominantPrimary[] {
  const second = mixtureComponents(m2);
  return mixtureComponents(m1).filter((c) => second.includes(c));
}

/** Garau's condition 8: degree from the role of the common colour in the two colours. */
export function degreeFromRoles(r1: ColourRole, r2: ColourRole): TransparencyDegree {
  if (r1 === 'subordinate' && r2 === 'subordinate') return 'Very transparent';
  if (r1 === 'dominant' && r2 === 'dominant') return 'Nearly opaque';
  return 'Intermediate';
}

/** Share of primary `c` in mixture `m`: the dominant holds 1 − ratio, the subordinate the ratio. */
export const amountOf = (m: GarauMixture, c: DominantPrimary): number =>
  m.dominant === c ? 1 - m.ratio : m.ratio;

function balanceOf(m1: GarauMixture, m2: GarauMixture, common: readonly DominantPrimary[]): BalanceReading {
  const balanced = common.some((c) => roleOf(m1, c) === roleOf(m2, c));
  const gap = Math.min(...common.map((c) => Math.abs(amountOf(m1, c) - amountOf(m2, c))));
  return { balanced, score: Math.round(PERCENT * Math.max(0, 1 - gap)) };
}

function nonTertiaryRelation(m1: GarauMixture, m2: GarauMixture): NonTertiaryRelation {
  if (m1.isAchromatic || m2.isAchromatic) return 'Achromatic';
  if (m1.isPure && m2.isPure) return 'Two primaries';
  const pure = m1.isPure ? m1 : m2.isPure ? m2 : null;
  if (pure !== null) {
    const other = pure === m1 ? m2 : m1;
    const complementary = other.isBalanced && !mixtureComponents(other).includes(pure.dominant);
    return complementary ? 'Complementary' : 'Primary and mixture';
  }
  if (m1.isBalanced || m2.isBalanced) return 'Balanced secondary';
  return 'Same mixture';
}

function tertiaryType(m1: GarauMixture, m2: GarauMixture): JuxtapositionType | null {
  if (m1.dominant === m2.dominant && m1.subordinate === m2.subordinate) return null;
  if (m1.subordinate === m2.subordinate) return 'Shared Subordinate';
  if (m1.dominant === m2.dominant) return 'Shared Dominant';
  if (m1.dominant === m2.subordinate && m1.subordinate === m2.dominant) return 'Complete Inversion';
  return 'Partial Inversion';
}

function describeType(type: JuxtapositionType, m1: GarauMixture, m2: GarauMixture): string {
  switch (type) {
    case 'Shared Subordinate':
      return (
        `Both colours share ${m1.subordinate} as subordinate; the dominants ${m1.dominant} and ` +
        `${m2.dominant} complete all three primaries, so the pair is complementary — a concord.`
      );
    case 'Shared Dominant':
      return (
        `Both colours share ${m1.dominant} as dominant; the differing subordinates ${m1.subordinate} and ` +
        `${m2.subordinate} pull the pair apart — a discordant tension.`
      );
    case 'Complete Inversion':
      return (
        `Complete inversion: ${m1.notation} and ${m2.notation} invert the same two primaries toward one ` +
        'secondary — closely bonded (a concord); as overlaps, the ground decides which shared colour is the veil.'
      );
    case 'Partial Inversion':
      return (
        `Partial inversion across all three primaries: ${m1.notation} and ${m2.notation} share one colour ` +
        'in opposite roles — a strong, discordant divergence.'
      );
  }
}

const CORRECTION: Record<JuxtapositionType, string | null> = {
  'Shared Subordinate': null,
  'Shared Dominant': null,
  'Complete Inversion':
    'Correct the ground so it assimilates the excess of the veil colour (Garau condition 7).',
  'Partial Inversion':
    'Counterbalance the asymmetry through the ground: the ground behind the overlap where the common ' +
    'colour dominates should itself contain that colour (Garau condition 7).',
};

function tertiaryReading(
  type: JuxtapositionType,
  m1: GarauMixture,
  m2: GarauMixture,
): TertiaryJuxtaposition {
  const common = sharedColours(m1, m2);
  const veil = common[0]!; // two different tertiaries of one type always share a colour
  return {
    kind: 'tertiary',
    type,
    harmony: HARMONY_BY_TYPE[type],
    harmonyNote: HARMONY_NOTE[type],
    color1Mixture: m1,
    color2Mixture: m2,
    degree: degreeFromRoles(roleOf(m1, veil)!, roleOf(m2, veil)!),
    balance: balanceOf(m1, m2, common),
    description: describeType(type, m1, m2),
    recommendedCorrection: CORRECTION[type],
  };
}

function nonTertiaryReading(m1: GarauMixture, m2: GarauMixture): NonTertiaryPair {
  const relation = nonTertiaryRelation(m1, m2);
  return {
    kind: 'non-tertiary',
    relation,
    harmony: 'Neutral',
    harmonyNote: 'Concord and discord describe pairs of two tertiary mixtures.',
    color1Mixture: m1,
    color2Mixture: m2,
    description: `${m1.notation} + ${m2.notation}: ${RELATION_NOTE[relation]}`,
  };
}

/** Classify a colour pair: one of the four juxtapositions if both are tertiaries, else a plain relation. */
export function classifyJuxtaposition(c1: RGB, c2: RGB): JuxtapositionAnalysis {
  const m1 = analyzeVisualMixture(c1);
  const m2 = analyzeVisualMixture(c2);
  const type = isTertiary(m1) && isTertiary(m2) ? tertiaryType(m1, m2) : null;
  return type === null ? nonTertiaryReading(m1, m2) : tertiaryReading(type, m1, m2);
}

/** One label for any pair reading: the juxtaposition type, or the non-tertiary relation. */
export const pairLabel = (a: JuxtapositionAnalysis): string =>
  a.kind === 'tertiary' ? a.type : a.relation;
