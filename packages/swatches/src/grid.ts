/**
 * The base layer — a systematic sampling of OKLab space.
 * `documents/OpenColorSystem-Proposal.md` §4.1, in the Nino repo.
 *
 * Achromatic colours get their own band, ordered by lightness only — never
 * scattered through the hue range. Chromatic colours are enumerated
 * hue-bucket × lightness-bucket × chroma-bucket. sRGB only for v1: P3/
 * Rec.2020 colours exist but can't be matched to print or dye, so including
 * them without a flag would be dishonest about what a designer can actually
 * produce.
 *
 * Chroma buckets are placed as **fractions of the maximum chroma actually
 * reachable at that lightness and hue** (`oklchMaxChroma`), not at fixed
 * absolute chroma values — every generated point is achievable in sRGB by
 * construction, rather than enumerating a fixed grid and discarding the
 * out-of-gamut remainder. This is also why the grid's true count is smaller
 * than `hueBins × lightnessBins × chromaBins`: near black and white, the
 * reachable chroma collapses toward zero, and buckets that would land below
 * the achromatic threshold are skipped rather than emitted as
 * near-duplicates of the neutral band.
 */

import { oklchMaxChroma } from '@garau/engine';
import type { OKLCH } from '@garau/engine';

/** Chroma at or below which a colour reads as grey rather than a hue — matches `ColorNaming.achromaticChroma` in Nino. */
export const ACHROMATIC_CHROMA = 0.025;

export interface GridOptions {
  /** Hue buckets around the circle. Matches the code scheme's two-digit 0–23 range (`OpenColorSystem-Proposal.md` §6). */
  readonly hueBins: number;
  /** Lightness buckets, chromatic and achromatic alike — matches Nino's own established default resolution for a hue×lightness plane. */
  readonly lightnessBins: number;
  /** Chroma buckets, as fractions of the in-gamut maximum at each hue/lightness. */
  readonly chromaBins: number;
}

export const DEFAULT_GRID_OPTIONS: GridOptions = {
  hueBins: 24,
  lightnessBins: 12,
  chromaBins: 6,
};

export interface GridPoint {
  readonly oklch: OKLCH;
  readonly hueBucket: number;
  readonly lightnessBucket: number;
  /** `null` for achromatic points. */
  readonly chromaBucket: number | null;
}

function bucketCenter(index: number, bins: number): number {
  return (index + 0.5) / bins;
}

/**
 * Enumerates the grid, ascending hue → lightness → chroma, achromatic band
 * first. Order is deterministic and load-bearing: `code.ts` assigns codes
 * from bucket indices alone, so re-running this against the same
 * `GridOptions` must always produce the same list in the same order.
 */
export function enumerateGrid(options: GridOptions = DEFAULT_GRID_OPTIONS): GridPoint[] {
  const points: GridPoint[] = [];

  for (let l = 0; l < options.lightnessBins; l += 1) {
    points.push({
      oklch: { L: bucketCenter(l, options.lightnessBins), C: 0, h: 0 },
      hueBucket: -1,
      lightnessBucket: l,
      chromaBucket: null,
    });
  }

  for (let h = 0; h < options.hueBins; h += 1) {
    const hue = bucketCenter(h, options.hueBins) * 360;
    for (let l = 0; l < options.lightnessBins; l += 1) {
      const lightness = bucketCenter(l, options.lightnessBins);
      const maxChroma = oklchMaxChroma(lightness, hue);
      if (maxChroma < ACHROMATIC_CHROMA) continue; // this L/h has no room to be chromatic — the achromatic band already covers it

      for (let c = 0; c < options.chromaBins; c += 1) {
        const chroma = maxChroma * ((c + 1) / options.chromaBins);
        if (chroma < ACHROMATIC_CHROMA) continue; // this fraction would round to indistinguishable-from-grey
        points.push({
          oklch: { L: lightness, C: chroma, h: hue },
          hueBucket: h,
          lightnessBucket: l,
          chromaBucket: c,
        });
      }
    }
  }

  return points;
}
