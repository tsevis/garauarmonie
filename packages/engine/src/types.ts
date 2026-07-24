/**
 * Garau Engine — Core type definitions.
 *
 * Ported from the reference Python engine (`reference/python-engine`). All
 * colors are treated as immutable plain objects; helper functions never mutate
 * their inputs.
 */

/** RGB color, channels 0–255. */
export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** RGB color, channels normalized to 0–1 for computation. */
export interface NormalizedRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** HSL — h: 0–360, s: 0–100, l: 0–100. */
export interface HSL {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

/** CIE Lab — perceptual, D65 illuminant. */
export interface Lab {
  readonly l: number; // 0–100
  readonly a: number; // ~ -128..127
  readonly b: number; // ~ -128..127
}

/**
 * LCH (Lightness, Chroma, Hue) — perceptually uniform space, crucial for
 * Garau's visual-mixture logic. l: 0–100, c: 0–100+, h: 0–360.
 */
export interface LCH {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

/** Garau's three fundamental primaries. */
export type DominantPrimary = 'R' | 'Y' | 'B';

/**
 * Analysis of a color as a *visual* mixture in Garau's framework.
 *
 * Garau's thesis: transparency perception depends on visual chromatic mixtures,
 * not physical ones. A color is a "visual mixture" if it appears to contain two
 * or more primary components to the average observer.
 */
export interface GarauMixture {
  readonly dominant: DominantPrimary;
  readonly subordinate: DominantPrimary | null;
  /** 0 = pure, 0.5 = balanced, approaching 1 = inverted. */
  readonly ratio: number;
  /** e.g. "rB" (reddish Blue), "Y" (pure Yellow), "RY" (balanced orange). */
  readonly notation: string;
  readonly hueAngle: number;
  readonly saturation: number;
  readonly lightness: number;
  /** Pure primary (no perceptible subordinate). */
  readonly isPure: boolean;
  /** Balanced mixture (green / orange / violet) — resists splitting. */
  readonly isBalanced: boolean;
  /** How easily the color splits perceptually: pure = 0, unbalanced = high. */
  readonly splittability: number;
}

/** Arnheim's four juxtaposition types for a color pair (the P–Q overlap pair). */
export type JuxtapositionType =
  | 'Shared Subordinate'
  | 'Shared Dominant'
  | 'Complete Inversion'
  | 'Partial Inversion';

/**
 * Garau's harmony grouping of a color pair (Color Harmonies, chs. 2–5).
 * Complete inversion and shared subordinate are balanced *concords*; shared
 * dominant and partial inversion are unbalanced *discords*. "Neutral" covers
 * pairs the grouping does not classify — e.g. when a color is a pure primary.
 */
export type HarmonyCategory = 'Balanced concord' | 'Unbalanced discord' | 'Neutral';

export interface JuxtapositionAnalysis {
  readonly type: JuxtapositionType;
  /** Garau's harmony grouping — the flat-plane aesthetic reading. */
  readonly harmony: HarmonyCategory;
  /** Why the pair is concordant or discordant, in terms of shared/divergent primaries. */
  readonly harmonyNote: string;
  readonly color1Mixture: GarauMixture;
  readonly color2Mixture: GarauMixture;
  /**
   * How strongly the pair reads as a transparency veil (0–100). Distinct from
   * harmony: shared-subordinate pairs are both concordant *and* the strongest
   * veils, but the two dimensions do not otherwise coincide.
   */
  readonly transparencyQuality: number;
  readonly description: string;
  readonly recommendedCorrection: string | null;
}

/** Configuration for a four-zone transparency display. */
export interface TransparencyConfig {
  readonly A: RGB; // Background 1 (opaque)
  readonly B: RGB; // Background 2 (opaque)
  readonly t: RGB; // Transparent layer color
  readonly alpha: number; // 0 = fully transparent, 1 = fully opaque
}

/** Result of a Metelli computation. */
export interface MetelliResult {
  readonly P: RGB; // Overlap zone 1 (figure over A)
  readonly Q: RGB; // Overlap zone 2 (figure over B)
  readonly t: RGB; // Transparent layer color (given or computed)
  readonly alpha: number;
  readonly valid: boolean;
  readonly warnings: readonly string[];
}

/**
 * Complete validation report covering Metelli's three conditions and Garau's
 * ten chromatic conditions.
 */
export interface ValidationReport {
  // Metelli conditions
  /** The recovered scission is realizable: α strictly between transparent and opaque (0 < α < 1). */
  readonly scissionRealizable: boolean;
  /** Lightness order preserved: lighter overlap sits over the lighter background. */
  readonly topologyPreserved: boolean;
  /** The veil reduces contrast: |L_P − L_Q| < |L_A − L_B|. */
  readonly contrastReduction: boolean;

  // Garau's 10 conditions
  readonly fourRegions: boolean;
  readonly visualMixtureP: boolean;
  readonly visualMixtureQ: boolean;
  readonly unbalancedPreference: boolean | null;
  readonly commonColorExists: boolean;
  readonly divergentColorsExist: boolean;
  readonly balancedTransparency: boolean;
  readonly alphaConsistency: boolean;

  // Overall assessment
  readonly overallValid: boolean;
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];

  // Quality metrics
  readonly transparencyQuality: number; // 0–100
  readonly juxtapositionType: JuxtapositionType | null;
}
