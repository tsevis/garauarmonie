/**
 * The Augusto swatch data model — `documents/OpenColorSystem-Proposal.md` §5,
 * in the Nino repo.
 *
 * Harmony relationships are deliberately **not** stored here: they're O(n²)
 * over the whole list and cheap to compute on demand from `oklab` +
 * `garau.notation` via `@garau/engine`'s `classifyJuxtaposition`, the same
 * way Nino computes harmony filters live rather than precomputing a
 * relationship table.
 */

import type { OKLab, OKLCH, GarauMixture } from '@garau/engine';

/** A colour's Garau decomposition — omitted for achromatic swatches, where hue is not a claim about the colour, it's the absence of one. */
export type SwatchGarau = Pick<GarauMixture, 'dominant' | 'subordinate' | 'notation' | 'splittability'>;

export interface SwatchName {
  /** The bare family, e.g. "blue", or "dark grey" for achromatic swatches. */
  readonly family: string;
  /** Full description, e.g. "deep vivid blue". */
  readonly full: string;
  /** Tone-not-hue common names for this region — "teal", "olive", "maroon", "navy", "purple", "brown". Empty for achromatic swatches. */
  readonly aliases: readonly string[];
}

export interface Swatch {
  /** Self-documenting: `{garauNotation|N}-{hueBucket}-{lightnessBucket}-{chromaBucket}`. See `code.ts`. */
  readonly code: string;
  readonly oklab: OKLab;
  readonly oklch: OKLCH;
  readonly srgbHex: string;
  /** `null` for achromatic swatches — a hue decomposition would not be a claim about the colour, it would be noise. */
  readonly garau: SwatchGarau | null;
  readonly name: SwatchName;
}

export interface SwatchArtifact {
  /**
   * Semver of this frozen grid. Bucket boundaries never change after a
   * version is tagged — see the proposal §7. No generation timestamp is
   * stored: the artifact is meant to be a pure function of source + version,
   * so `build.ts` run twice against the same version produces byte-identical
   * output — that identity is what "reproducible" is tested against.
   */
  readonly gridVersion: string;
  readonly hueBins: number;
  readonly lightnessBins: number;
  readonly chromaBins: number;
  readonly swatches: readonly Swatch[];
}
