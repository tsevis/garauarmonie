/**
 * Garau's central chromatic conditions (Color Harmonies, ch. 9, pp. 55–57),
 * read on the RYB components of the six zones of a display.
 *
 *  4. The colour the two overlaps share becomes the veil's colour.
 *  5. The other two colours become the ground colours.
 *  7. If the common colour is unbalanced, the ground must assimilate the excess.
 *  8. The role of the common colour sets the degree of transparency.
 *  9. Designing from the ground: a Y and B ground asks for a red veil.
 * 10. A ground of mixtures with a shared subordinate asks for more of it.
 *
 * Each check returns null when it does not apply (an achromatic veil, a
 * balanced common colour for condition 7, a ground the book gives no rule for).
 */

import type { DominantPrimary, GarauMixture, TransparencyDegree } from './types.js';
import { isTertiary, mixtureComponents } from './visualMixture.js';
import { amountOf, degreeFromRoles, roleOf, sharedColours } from './juxtaposition.js';

const PRIMARIES: readonly DominantPrimary[] = ['R', 'Y', 'B'];

/** The six zones of a display, read as Garau mixtures. */
export interface DisplayMixtures {
  readonly A: GarauMixture;
  readonly B: GarauMixture;
  readonly P: GarauMixture;
  readonly Q: GarauMixture;
  readonly t: GarauMixture;
}

/** The primaries a veil lays down: its dominant, or both halves of a balanced secondary. */
function veilPrimaries(t: GarauMixture): readonly DominantPrimary[] {
  if (t.isAchromatic) return [];
  return t.isBalanced ? mixtureComponents(t) : [t.dominant];
}

/** The veil's colour as P and Q carry it: the veil primary they share, if any. */
export function veilColour(d: DisplayMixtures): DominantPrimary | null {
  const common = sharedColours(d.P, d.Q);
  return veilPrimaries(d.t).find((c) => common.includes(c)) ?? null;
}

/** Condition 4. Null for an achromatic veil, which has no colour to share. */
export function veilIsCommonColour(d: DisplayMixtures): boolean | null {
  if (d.t.isAchromatic) return null;
  return veilColour(d) !== null;
}

/** What an overlap shows besides the veil colour must be held by its ground. */
function restIsGround(overlap: GarauMixture, ground: GarauMixture, veil: DominantPrimary): boolean {
  const rest = mixtureComponents(overlap).filter((c) => c !== veil);
  const held = mixtureComponents(ground);
  return rest.length > 0 && rest.every((c) => held.includes(c));
}

/** Condition 5. Null when condition 4 has no veil colour to subtract. */
export function groundsAreDivergentColours(d: DisplayMixtures): boolean | null {
  const veil = veilColour(d);
  if (veil === null) return null;
  return restIsGround(d.P, d.A, veil) && restIsGround(d.Q, d.B, veil);
}

/**
 * Condition 7. When the veil colour has different roles in the two overlaps,
 * the ground behind the overlap holding more of it must itself contain the
 * veil colour (pl. 37, 39). Null when the roles agree (balanced, condition 6).
 */
export function groundAssimilatesExcess(d: DisplayMixtures): boolean | null {
  const veil = veilColour(d);
  if (veil === null) return null;
  if (roleOf(d.P, veil) === roleOf(d.Q, veil)) return null;
  const ground = amountOf(d.P, veil) > amountOf(d.Q, veil) ? d.A : d.B;
  return mixtureComponents(ground).includes(veil);
}

/** Condition 8 for the display: the role of the veil colour in P and Q. */
export function displayDegree(d: DisplayMixtures): TransparencyDegree | null {
  const veil = veilColour(d);
  if (veil === null) return null;
  return degreeFromRoles(roleOf(d.P, veil)!, roleOf(d.Q, veil)!);
}

/**
 * Conditions 9–10: the veil colour the ground asks for. Two different pure
 * primaries ask for the third; two tertiaries sharing a subordinate ask for
 * more of it. Any other ground: null, the book gives no rule.
 */
export function veilForGround(A: GarauMixture, B: GarauMixture): DominantPrimary | null {
  if (A.isPure && B.isPure && A.dominant !== B.dominant) {
    return PRIMARIES.find((c) => c !== A.dominant && c !== B.dominant) ?? null;
  }
  const sharedSubordinate =
    isTertiary(A) && isTertiary(B) && A.subordinate === B.subordinate && A.dominant !== B.dominant;
  return sharedSubordinate ? A.subordinate : null;
}

/** Conditions 9–10 checked against the actual veil. */
export function veilFromGround(d: DisplayMixtures): boolean | null {
  const asked = veilForGround(d.A, d.B);
  if (asked === null) return null;
  return veilPrimaries(d.t).includes(asked);
}
