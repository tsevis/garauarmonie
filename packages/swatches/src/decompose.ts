/**
 * The decomposition layer — the "why". `OpenColorSystem-Proposal.md` §4.2.
 *
 * A pure function, computed once at generation time: dominant primary,
 * subordinate, Garau notation, splittability. No new theory work — a direct
 * reuse of `@garau/engine`'s `analyzeVisualMixture`, the same decomposition
 * GarauArmonie's Analyzer already performs on any colour dropped onto the
 * chromatic disk.
 */

import { analyzeVisualMixture, oklchToRgb } from '@garau/engine';
import type { OKLCH } from '@garau/engine';
import type { SwatchGarau } from './types.js';

/** `null` for achromatic points (`C === 0`) — a dominant/subordinate hue would not be a claim about the colour, it would be the arithmetic's own noise at zero chroma. */
export function decompose(oklch: OKLCH): SwatchGarau | null {
  if (oklch.C <= 0) return null;
  const mixture = analyzeVisualMixture(oklchToRgb(oklch));
  return {
    dominant: mixture.dominant,
    subordinate: mixture.subordinate,
    notation: mixture.notation,
    splittability: mixture.splittability,
  };
}
