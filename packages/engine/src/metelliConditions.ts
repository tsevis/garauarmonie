/**
 * Metelli's three necessary conditions for a compelling transparency.
 *
 * Kept in its own module because both `metelli.ts` (inverse mode) and
 * `validation.ts` (the full report) need it, and importing it from either of
 * those into the other would close an import cycle.
 */

import type { RGB } from './types.js';
import { getLuminance } from './conversions.js';

export interface MetelliConditions {
  readonly scissionRealizable: boolean;
  readonly topologyPreserved: boolean;
  readonly contrastReduction: boolean;
  readonly warnings: readonly string[];
}

const EPS = 1e-4;

/**
 * A transparent veil *reduces* contrast — so the two overlaps must be closer in
 * lightness than the two backgrounds (contrast reduction), keep the same
 * lightness order (topology), and correspond to a physically realizable scission
 * with 0 < α < 1. (The reference engine's "lightness ordering" condition
 * required |L_P − L_Q| to *exceed* |L_A − L_B| — the opposite of contrast
 * reduction, so honest transparencies could never validate; it is corrected here.)
 */
export function checkMetelliConditions(
  A: RGB,
  B: RGB,
  P: RGB,
  Q: RGB,
  alpha: number,
): MetelliConditions {
  const warnings: string[] = [];
  const lA = getLuminance(A);
  const lB = getLuminance(B);
  const lP = getLuminance(P);
  const lQ = getLuminance(Q);

  const bgContrast = Math.abs(lA - lB);
  const figContrast = Math.abs(lP - lQ);
  const backgroundsDiffer = bgContrast > EPS;

  if (!backgroundsDiffer) {
    warnings.push('Backgrounds are (near) identical — no transparency can be established');
  }

  // Scission realizable: α is a genuine transparency, neither invisible nor opaque.
  const scissionRealizable = backgroundsDiffer && alpha > EPS && alpha < 1 - EPS;
  if (backgroundsDiffer && !scissionRealizable) {
    warnings.push(`Scission not realizable: α (${alpha.toFixed(3)}) must lie strictly in (0, 1)`);
  }

  // Order preservation: lighter overlap over lighter background (trivially held
  // when the veil is so transparent the overlaps barely differ).
  const orderMatches = figContrast < EPS || lP > lQ === lA > lB;
  const topologyPreserved = backgroundsDiffer && orderMatches;
  if (backgroundsDiffer && !topologyPreserved) {
    warnings.push('Topology violated: the lighter overlap should sit over the lighter background');
  }

  // Contrast reduction: the veil brings the overlaps closer together than the backgrounds.
  const contrastReduction = backgroundsDiffer && figContrast <= bgContrast + EPS;
  if (backgroundsDiffer && !contrastReduction) {
    warnings.push(
      `Contrast reduction violated: overlap contrast (${figContrast.toFixed(3)}) ` +
        `should be below background contrast (${bgContrast.toFixed(3)})`,
    );
  }

  return { scissionRealizable, topologyPreserved, contrastReduction, warnings };
}
