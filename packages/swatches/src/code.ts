/**
 * The coding scheme — self-documenting, unlike Pantone's opaque sequence
 * numbers. `OpenColorSystem-Proposal.md` §6:
 *
 * ```
 * yR-14-06-3
 * │  │  │  │
 * │  │  │  └─ chroma bucket
 * │  │  └──── lightness bucket
 * │  └─────── hue bucket (0–23)
 * └────────── Garau notation of the dominant/subordinate pair
 * ```
 *
 * A designer who knows Garau's system can read the family straight off the
 * code without a lookup. Achromatic swatches have no hue or chroma bucket,
 * so they use the parallel form `N-06` (lightness bucket only) — `N` reads
 * as "neutral" the same way the notation reads as a hue family.
 */

import type { GridPoint } from './grid.js';
import type { SwatchGarau } from './types.js';

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export function codeFor(point: GridPoint, garau: SwatchGarau | null): string {
  if (point.chromaBucket === null || garau === null) {
    return `N-${pad2(point.lightnessBucket)}`;
  }
  return `${garau.notation}-${pad2(point.hueBucket)}-${pad2(point.lightnessBucket)}-${point.chromaBucket}`;
}
