/**
 * Validation — Metelli's three conditions plus Garau's ten chromatic conditions.
 *
 * Ported from `reference/python-engine/color_engine/validation.py`. One
 * deliberate correction: the reference's balanced-transparency check collapsed
 * algebraically to `P` and never used the backgrounds, so it could not measure
 * balance. Here we recover t from the P-side (via A) and the Q-side (via B) and
 * compare them — the actual meaning of Garau's condition 6.
 */

import type { RGB, GarauMixture, ValidationReport } from './types.js';
import { rgbToLinear, rgbToNormalized } from './conversions.js';
import { analyzeVisualMixture } from './visualMixture.js';
import { classifyJuxtaposition, sharedColours } from './juxtaposition.js';
import { computeInverse } from './metelli.js';
import { checkMetelliConditions } from './metelliConditions.js';
import type { MetelliConditions } from './metelliConditions.js';
import {
  displayDegree,
  groundAssimilatesExcess,
  groundsAreDivergentColours,
  veilFromGround,
  veilIsCommonColour,
} from './garauConditions.js';
import type { DisplayMixtures } from './garauConditions.js';

/** P and Q share an RYB component. Greys share nothing: they have no hue to split. */
function commonColorExistsFor(m1: GarauMixture, m2: GarauMixture): [boolean, string | null] {
  const common = sharedColours(m1, m2);
  if (common.length === 0) return [false, null];
  const roles = common.map((c) => `${c} (${m1.dominant === c ? 'dominant' : 'subordinate'} in P, ` +
    `${m2.dominant === c ? 'dominant' : 'subordinate'} in Q)`);
  return [true, roles.join('; ')];
}

function divergentColorsFor(m1: GarauMixture, m2: GarauMixture): [boolean, string] {
  const divergent: string[] = [];
  if (m1.dominant !== m2.dominant) divergent.push(`Dominants: ${m1.dominant} vs ${m2.dominant}`);
  if (m1.subordinate !== m2.subordinate) {
    divergent.push(`Subordinates: ${m1.subordinate ?? 'none'} vs ${m2.subordinate ?? 'none'}`);
  }
  return divergent.length > 0 ? [true, divergent.join('; ')] : [false, 'No divergent components found'];
}

/** Largest distance (linear RGB) between the t recovered over A and over B. */
const T_BALANCE_TOLERANCE = 0.15;
/** At or above this α the veil is opaque and balance is moot. */
const OPAQUE_ALPHA = 0.99;

/**
 * Physical balance — is t present in P and Q in equal proportion? Recover t,
 * in linear light, from each side using its own background and compare.
 * (Garau's own condition 6, on the role of the common colour, is the pair's
 * `balance` readout.)
 */
function balancedTransparency(
  A: RGB,
  B: RGB,
  P: RGB,
  Q: RGB,
  alpha: number,
  tolerance = T_BALANCE_TOLERANCE,
): [boolean, string] {
  if (alpha >= OPAQUE_ALPHA) return [true, 'Opaque limit — balance not applicable'];
  const an = rgbToLinear(A);
  const bn = rgbToLinear(B);
  const pn = rgbToLinear(P);
  const qn = rgbToLinear(Q);
  const tFromP = [
    (pn.r - alpha * an.r) / (1 - alpha),
    (pn.g - alpha * an.g) / (1 - alpha),
    (pn.b - alpha * an.b) / (1 - alpha),
  ];
  const tFromQ = [
    (qn.r - alpha * bn.r) / (1 - alpha),
    (qn.g - alpha * bn.g) / (1 - alpha),
    (qn.b - alpha * bn.b) / (1 - alpha),
  ];
  const dev = Math.sqrt(
    tFromP.reduce((s, v, i) => s + (v - tFromQ[i]!) ** 2, 0),
  );
  return dev < tolerance
    ? [true, `Balanced (t deviation: ${dev.toFixed(3)})`]
    : [false, `Unbalanced (t deviation: ${dev.toFixed(3)})`];
}

/** Warnings and suggestions one group of checks contributes to the report. */
interface Notes {
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

const merge = (...all: readonly Notes[]): Notes => ({
  warnings: all.flatMap((n) => n.warnings),
  suggestions: all.flatMap((n) => n.suggestions),
});

/** Distance between two backgrounds in sRGB below which they read as one. */
const SIMILAR_BACKGROUNDS = 0.1;

/** Conditions 2–3: P and Q read as chromatic, preferably unbalanced, mixtures. */
function mixtureChecks(pMix: GarauMixture, qMix: GarauMixture) {
  const isMixture = (m: GarauMixture): boolean => !m.isPure && !m.isAchromatic;
  const visualMixtureP = isMixture(pMix);
  const visualMixtureQ = isMixture(qMix);
  const unbalancedPreference = !(pMix.isBalanced || qMix.isBalanced);
  const warn = (zone: string, m: GarauMixture): string =>
    `Zone ${zone} (${m.notation}) is ${m.isAchromatic ? 'achromatic' : 'a pure color'}, not a visual mixture`;
  const notes: Notes = {
    warnings: [
      ...(visualMixtureP ? [] : [warn('P', pMix)]),
      ...(visualMixtureQ ? [] : [warn('Q', qMix)]),
    ],
    suggestions: [
      ...(visualMixtureP && visualMixtureQ ? [] : ['Make P and Q mixtures for a stronger transparency effect']),
      ...(pMix.isBalanced && qMix.isBalanced
        ? ['Both P and Q are balanced mixtures, which resist splitting. Use unbalanced mixtures.']
        : []),
    ],
  };
  return { fields: { visualMixtureP, visualMixtureQ, unbalancedPreference }, notes };
}

/** P and Q share a colour and differ in another (the precondition for 4–5). */
function sharedAndDivergent(pMix: GarauMixture, qMix: GarauMixture) {
  const [commonColorExists, commonDesc] = commonColorExistsFor(pMix, qMix);
  const [divergentColorsExist, divergentDesc] = divergentColorsFor(pMix, qMix);
  const notes: Notes = {
    warnings: [
      ...(commonColorExists ? [] : ['No common color component found between P and Q']),
      ...(divergentColorsExist ? [] : ['No divergent color components found']),
    ],
    suggestions: [
      commonColorExists ? `Common color: ${commonDesc}` : 'P and Q should share a colour: it becomes the veil',
      ...(divergentColorsExist ? [`Divergent components: ${divergentDesc}`] : []),
    ],
  };
  return { fields: { commonColorExists, divergentColorsExist }, notes };
}

/** Garau's conditions 4, 5, 7, 8 and 9–10 on the six zones. */
function garauChecks(d: DisplayMixtures) {
  const fields = {
    veilIsCommonColor: veilIsCommonColour(d),
    groundsAreDivergentColors: groundsAreDivergentColours(d),
    groundAssimilatesExcess: groundAssimilatesExcess(d),
    veilFromGround: veilFromGround(d),
    degreeOfTransparency: displayDegree(d),
  };
  const notes: Notes = {
    warnings: [
      ...(fields.veilIsCommonColor === false ? [`The veil (${d.t.notation}) is not the colour P and Q share`] : []),
      ...(fields.groundsAreDivergentColors === false
        ? ['The colours P and Q do not share are not the ground colours']
        : []),
    ],
    suggestions: [
      ...(d.t.isAchromatic ? ['The veil is achromatic: Garau’s chromatic conditions do not apply to it'] : []),
      ...(fields.groundAssimilatesExcess === false
        ? ['The common colour is unbalanced: let the ground behind the overlap it dominates contain it']
        : []),
      ...(fields.veilFromGround === false ? ['This ground asks for a different veil colour (conditions 9–10)'] : []),
    ],
  };
  return { fields, notes };
}

function backgroundNotes(A: RGB, B: RGB, aMix: GarauMixture, bMix: GarauMixture): Notes {
  const an = rgbToNormalized(A);
  const bn = rgbToNormalized(B);
  const bgDiff = Math.hypot(an.r - bn.r, an.g - bn.g, an.b - bn.b);
  return {
    warnings: [],
    suggestions: [
      ...(bgDiff < SIMILAR_BACKGROUNDS ? ['Backgrounds are very similar. Increase the contrast between A and B.'] : []),
      ...(!aMix.isPure || !bMix.isPure ? [`Backgrounds are mixtures: A=${aMix.notation}, B=${bMix.notation}.`] : []),
    ],
  };
}

/** The physical side: Metelli's conditions, α agreement and t balance. */
function physicalChecks(A: RGB, B: RGB, P: RGB, Q: RGB, alpha: number) {
  const metelli: MetelliConditions = checkMetelliConditions(A, B, P, Q, alpha);
  const inverse = computeInverse(A, B, P, Q);
  const alphaConsistency = !inverse.warnings.some((w) => w.includes('Alpha inconsistency'));
  const [balanced, balanceDesc] = balancedTransparency(A, B, P, Q, alpha);
  const notes: Notes = {
    warnings: [
      ...(alphaConsistency ? [] : ['Alpha varies across color channels — may not be a balanced transparency']),
      ...(balanced ? [] : [`Transparency is unbalanced: ${balanceDesc}`]),
      ...metelli.warnings,
    ],
    suggestions: balanced ? [] : ['For balanced transparency, t should be present equally in P and Q'],
  };
  return { metelli, alphaConsistency, balanced, notes };
}

/** Full validation of a four-zone configuration against all conditions. */
export function validateTransparency(
  A: RGB,
  B: RGB,
  P: RGB,
  Q: RGB,
  t: RGB,
  alpha: number,
): ValidationReport {
  const d: DisplayMixtures = {
    A: analyzeVisualMixture(A),
    B: analyzeVisualMixture(B),
    P: analyzeVisualMixture(P),
    Q: analyzeVisualMixture(Q),
    t: analyzeVisualMixture(t),
  };
  const mixtures = mixtureChecks(d.P, d.Q);
  const shared = sharedAndDivergent(d.P, d.Q);
  const garau = garauChecks(d);
  const physical = physicalChecks(A, B, P, Q, alpha);
  const pair = classifyJuxtaposition(P, Q);
  const notes = merge(mixtures.notes, shared.notes, garau.notes, backgroundNotes(A, B, d.A, d.B), physical.notes);
  const { metelli } = physical;

  const overallValid =
    metelli.scissionRealizable &&
    metelli.topologyPreserved &&
    metelli.contrastReduction &&
    shared.fields.commonColorExists &&
    garau.fields.veilIsCommonColor !== false &&
    garau.fields.groundsAreDivergentColors !== false &&
    physical.alphaConsistency;

  return {
    scissionRealizable: metelli.scissionRealizable,
    topologyPreserved: metelli.topologyPreserved,
    contrastReduction: metelli.contrastReduction,
    fourRegions: true,
    ...mixtures.fields,
    ...shared.fields,
    ...garau.fields,
    balancedTransparency: physical.balanced,
    alphaConsistency: physical.alphaConsistency,
    overallValid,
    warnings: notes.warnings,
    suggestions: notes.suggestions,
    balance: pair.kind === 'tertiary' ? pair.balance : null,
    juxtapositionType: pair.kind === 'tertiary' ? pair.type : null,
    pairRelation: pair.kind === 'non-tertiary' ? pair.relation : null,
  };
}

/** Human-readable one-glance summary of a validation report. */
export function getValiditySummary(report: ValidationReport): string {
  const status = report.overallValid
    ? '✓ Valid transparency configuration'
    : '✗ Invalid transparency configuration';
  const lines = [
    status,
    `Degree of transparency: ${report.degreeOfTransparency ?? 'not applicable'}`,
    `Balance: ${report.balance === null ? 'not applicable' : `${report.balance.score}/100`}`,
    `Juxtaposition: ${report.juxtapositionType ?? report.pairRelation ?? 'Unknown'}`,
  ];
  const warnings = report.warnings.length > 0 ? ['', 'Warnings:', ...report.warnings.map((w) => `  • ${w}`)] : [];
  const suggestions =
    report.suggestions.length > 0
      ? ['', 'Suggestions:', ...report.suggestions.slice(0, 3).map((s) => `  • ${s}`)]
      : [];
  return [...lines, ...warnings, ...suggestions].join('\n');
}
