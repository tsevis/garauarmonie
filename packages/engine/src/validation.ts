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
import { rgbToNormalized } from './conversions.js';
import { analyzeVisualMixture, classifyJuxtaposition, hueDistance } from './visualMixture.js';
import { computeInverse } from './metelli.js';
import { checkMetelliConditions } from './metelliConditions.js';

function commonColorExists(m1: GarauMixture, m2: GarauMixture): [boolean, string | null] {
  if (m1.subordinate !== null && m2.subordinate !== null && m1.subordinate === m2.subordinate) {
    return [true, `Shared subordinate: ${m1.subordinate}`];
  }
  if (m1.dominant === m2.dominant) return [true, `Shared dominant: ${m1.dominant}`];
  if (m1.subordinate !== null && m2.subordinate !== null) {
    if (m1.dominant === m2.subordinate)
      return [true, `Inversion: ${m1.dominant} is dominant in one, subordinate in the other`];
    if (m1.subordinate === m2.dominant)
      return [true, `Inversion: ${m1.subordinate} is subordinate in one, dominant in the other`];
  }
  const hueDiff = hueDistance(m1.hueAngle, m2.hueAngle);
  if (hueDiff < 45) return [true, `Close hues (${hueDiff.toFixed(1)}° apart) share perceptual components`];
  return [false, null];
}

function divergentColorsExist(m1: GarauMixture, m2: GarauMixture): [boolean, string] {
  const divergent: string[] = [];
  if (m1.dominant !== m2.dominant) divergent.push(`Dominants: ${m1.dominant} vs ${m2.dominant}`);
  if (m1.subordinate !== m2.subordinate) {
    divergent.push(`Subordinates: ${m1.subordinate ?? 'none'} vs ${m2.subordinate ?? 'none'}`);
  }
  return divergent.length > 0 ? [true, divergent.join('; ')] : [false, 'No divergent components found'];
}

/**
 * Garau condition 6 — is t present in P and Q in equal proportion?
 * Recover t from each side using its own background and compare (corrected).
 */
function balancedTransparency(
  A: RGB,
  B: RGB,
  P: RGB,
  Q: RGB,
  alpha: number,
  tolerance = 0.15,
): [boolean, string] {
  if (alpha >= 0.99) return [true, 'Opaque limit — balance not applicable'];
  const an = rgbToNormalized(A);
  const bn = rgbToNormalized(B);
  const pn = rgbToNormalized(P);
  const qn = rgbToNormalized(Q);
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

function transparencyDegree(t: RGB, p: GarauMixture, q: GarauMixture): [string, string] {
  const tm = analyzeVisualMixture(t);
  if (p.subordinate === tm.dominant && q.subordinate === tm.dominant)
    return ['very_transparent', 'Common color is subordinate in both mixtures'];
  if (p.dominant === tm.dominant && q.dominant === tm.dominant)
    return ['more_opaque', 'Common color is dominant in both mixtures'];
  return ['intermediate', 'Mixed dominance relationship'];
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
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const pMix = analyzeVisualMixture(P);
  const qMix = analyzeVisualMixture(Q);

  const visualMixtureP = !pMix.isPure;
  if (!visualMixtureP) {
    warnings.push(`Zone P (${pMix.notation}) is a pure color, not a visual mixture`);
    suggestions.push('Consider adjusting P to be a mixture for a stronger transparency effect');
  }
  const visualMixtureQ = !qMix.isPure;
  if (!visualMixtureQ) {
    warnings.push(`Zone Q (${qMix.notation}) is a pure color, not a visual mixture`);
    suggestions.push('Consider adjusting Q to be a mixture for a stronger transparency effect');
  }

  let unbalancedPreference: boolean | null;
  if (pMix.isBalanced || qMix.isBalanced) {
    unbalancedPreference = false;
    if (pMix.isBalanced && qMix.isBalanced) {
      suggestions.push(
        'Both P and Q are balanced mixtures. These resist perceptual splitting. ' +
          'Consider unbalanced mixtures for stronger transparency.',
      );
    }
  } else {
    unbalancedPreference = true;
  }

  const [commonExists, commonDesc] = commonColorExists(pMix, qMix);
  if (!commonExists) {
    warnings.push('No common color component found between P and Q');
    suggestions.push('P and Q should share a perceptual color component (this becomes t)');
  } else if (commonDesc) {
    suggestions.push(`Common color: ${commonDesc}`);
  }

  const [divergentExists, divergentDesc] = divergentColorsExist(pMix, qMix);
  if (!divergentExists) warnings.push('No divergent color components found');
  else suggestions.push(`Divergent components: ${divergentDesc}`);

  const [balanced, balanceDesc] = balancedTransparency(A, B, P, Q, alpha);
  if (!balanced) {
    warnings.push(`Transparency is unbalanced: ${balanceDesc}`);
    suggestions.push('For balanced transparency, t should be present equally in P and Q');
  }

  const [degree, degreeDesc] = transparencyDegree(t, pMix, qMix);
  suggestions.push(`Transparency degree: ${degree} — ${degreeDesc}`);

  const an = rgbToNormalized(A);
  const bn = rgbToNormalized(B);
  const bgDiff = Math.sqrt((an.r - bn.r) ** 2 + (an.g - bn.g) ** 2 + (an.b - bn.b) ** 2);
  if (bgDiff < 0.1) {
    suggestions.push('Backgrounds are very similar. Increase contrast between A and B for a clearer transparency.');
  }

  const aMix = analyzeVisualMixture(A);
  const bMix = analyzeVisualMixture(B);
  if (!aMix.isPure || !bMix.isPure) {
    suggestions.push(`Backgrounds are mixtures: A=${aMix.notation}, B=${bMix.notation}. This adds complexity.`);
  }

  const inverse = computeInverse(A, B, P, Q);
  const alphaConsistency = !inverse.warnings.some((w) => w.includes('Alpha inconsistency'));
  if (!alphaConsistency) {
    warnings.push('Alpha varies across color channels — may not be a balanced transparency');
  }

  const metelli = checkMetelliConditions(A, B, P, Q, alpha);
  warnings.push(...metelli.warnings);

  const juxtaposition = classifyJuxtaposition(P, Q);

  const qualityFactors = [
    juxtaposition.transparencyQuality,
    pMix.splittability * 100,
    qMix.splittability * 100,
  ];
  let penalty = 0;
  if (!metelli.contrastReduction) penalty += 15;
  if (!metelli.topologyPreserved) penalty += 15;
  if (!metelli.scissionRealizable) penalty += 10;
  if (!visualMixtureP) penalty += 10;
  if (!visualMixtureQ) penalty += 10;
  if (!commonExists) penalty += 20;
  const meanQuality = qualityFactors.reduce((s, v) => s + v, 0) / qualityFactors.length;
  const transparencyQuality = Math.max(0, Math.min(100, meanQuality - penalty));

  const overallValid =
    metelli.scissionRealizable &&
    metelli.topologyPreserved &&
    metelli.contrastReduction &&
    commonExists &&
    alphaConsistency;

  return {
    scissionRealizable: metelli.scissionRealizable,
    topologyPreserved: metelli.topologyPreserved,
    contrastReduction: metelli.contrastReduction,
    fourRegions: true,
    visualMixtureP,
    visualMixtureQ,
    unbalancedPreference,
    commonColorExists: commonExists,
    divergentColorsExist: divergentExists,
    balancedTransparency: balanced,
    alphaConsistency,
    overallValid,
    warnings,
    suggestions,
    transparencyQuality,
    juxtapositionType: juxtaposition.type,
  };
}

/** Human-readable one-glance summary of a validation report. */
export function getValiditySummary(report: ValidationReport): string {
  const status = report.overallValid
    ? '✓ Valid transparency configuration'
    : '✗ Invalid transparency configuration';
  const lines = [
    status,
    `Transparency quality: ${report.transparencyQuality.toFixed(0)}/100`,
    `Juxtaposition type: ${report.juxtapositionType ?? 'Unknown'}`,
  ];
  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:');
    report.warnings.forEach((w) => lines.push(`  • ${w}`));
  }
  if (report.suggestions.length > 0) {
    lines.push('', 'Suggestions:');
    report.suggestions.slice(0, 3).forEach((s) => lines.push(`  • ${s}`));
  }
  return lines.join('\n');
}
