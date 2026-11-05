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

/**
 * OKLab (Björn Ottosson, 2020) — a Lab-style perceptually uniform space with
 * more even hue than CIE Lab. L: 0–1 (black–white), a/b: opponent axes,
 * roughly -0.4..0.4 for sRGB.
 */
export interface OKLab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

/** Cylindrical OKLab. L: 0–1, C: 0–~0.4 for sRGB, h: 0–360. */
export interface OKLCH {
  readonly L: number;
  readonly C: number;
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
  /** Grey, white or black: no hue, so no dominant or subordinate applies. */
  readonly isAchromatic: boolean;
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
 * pairs the grouping does not classify: every pair that is not two tertiaries.
 */
export type HarmonyCategory = 'Balanced concord' | 'Unbalanced discord' | 'Neutral';

/**
 * A pair outside the four juxtapositions, which the book defines only between
 * two tertiaries (unbalanced 2:1 mixtures).
 */
export type NonTertiaryRelation =
  /** One colour is grey, white or black: no hue to split. */
  | 'Achromatic'
  /** Two pure primaries. */
  | 'Two primaries'
  /** A primary beside the balanced secondary of the other two (Y–V, R–G, B–O). */
  | 'Complementary'
  /** A primary beside any other mixture (Color Harmonies, ch. 1). */
  | 'Primary and mixture'
  /** A balanced secondary beside another mixture, with no primary in the pair. */
  | 'Balanced secondary'
  /** Two colours that read as the same tertiary. */
  | 'Same mixture';

/**
 * Garau's condition 8: the role of the common colour sets the degree of
 * transparency. Subordinate in both → very transparent; dominant in both →
 * nearly opaque. The book gives no degree for the mixed (inversion) cases.
 */
export type TransparencyDegree = 'Very transparent' | 'Intermediate' | 'Nearly opaque';

/** Garau's condition 6, read on a pair: is the common colour present equally in both? */
export interface BalanceReading {
  /** The common colour has the same role (dominant, or subordinate) in both colours. */
  readonly balanced: boolean;
  /** 0–100: how equal the amount of the common colour is in the two colours. */
  readonly score: number;
}

interface PairReadingBase {
  /** Garau's harmony grouping — the flat-plane aesthetic reading. */
  readonly harmony: HarmonyCategory;
  /** Why the pair is concordant, discordant or neither. */
  readonly harmonyNote: string;
  readonly color1Mixture: GarauMixture;
  readonly color2Mixture: GarauMixture;
  readonly description: string;
}

/** Two tertiaries: one of Arnheim's four juxtapositions, with Garau's two readouts. */
export interface TertiaryJuxtaposition extends PairReadingBase {
  readonly kind: 'tertiary';
  readonly type: JuxtapositionType;
  /** Condition 8: how transparent a veil this pair makes. */
  readonly degree: TransparencyDegree;
  /** Condition 6: how balanced (convincing) the veil is. */
  readonly balance: BalanceReading;
  readonly recommendedCorrection: string | null;
}

/** Any other pair: no juxtaposition type and no transparency readout apply. */
export interface NonTertiaryPair extends PairReadingBase {
  readonly kind: 'non-tertiary';
  readonly relation: NonTertiaryRelation;
}

export type JuxtapositionAnalysis = TertiaryJuxtaposition | NonTertiaryPair;

/** Configuration for a four-zone transparency display. */
export interface TransparencyConfig {
  readonly A: RGB; // Background 1 (opaque)
  readonly B: RGB; // Background 2 (opaque)
  readonly t: RGB; // Transparent layer color
  /** Metelli's photometric α, in linear light: the share of the ground that shows through (1 = clear, 0 = opaque veil). */
  readonly alpha: number;
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
 * chromatic conditions (Color Harmonies, ch. 9, pp. 55–57).
 */
export interface ValidationReport {
  // Metelli conditions
  /** The recovered scission is realizable: α strictly between transparent and opaque (0 < α < 1). */
  readonly scissionRealizable: boolean;
  /** Lightness order preserved: lighter overlap sits over the lighter background. */
  readonly topologyPreserved: boolean;
  /** The veil reduces contrast: |L_P − L_Q| < |L_A − L_B|. */
  readonly contrastReduction: boolean;

  // Garau's conditions
  /** 1: two figure regions and two ground regions. */
  readonly fourRegions: boolean;
  /** 2: each overlap reads as a chromatic mixture (not pure, not grey). */
  readonly visualMixtureP: boolean;
  readonly visualMixtureQ: boolean;
  /** 3: unbalanced mixtures split more readily than balanced secondaries. */
  readonly unbalancedPreference: boolean | null;
  /** P and Q share at least one RYB component. */
  readonly commonColorExists: boolean;
  /** 4: the colour P and Q share is the veil's colour. Null for an achromatic veil. */
  readonly veilIsCommonColor: boolean | null;
  /** P and Q differ in at least one component. */
  readonly divergentColorsExist: boolean;
  /** 5: what each overlap shows besides the veil colour is its ground's colour. */
  readonly groundsAreDivergentColors: boolean | null;
  /** Metelli/Da Pos balance: t recovered over A equals t recovered over B. */
  readonly balancedTransparency: boolean;
  /** 7: with an unbalanced common colour, the ground absorbs the excess. Null when balanced. */
  readonly groundAssimilatesExcess: boolean | null;
  /** 9–10: the veil is the colour the ground asks for. Null when the book gives no rule. */
  readonly veilFromGround: boolean | null;
  /** α agrees across the three channels within Da Pos's ±0.05. */
  readonly alphaConsistency: boolean;

  // Overall assessment
  readonly overallValid: boolean;
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];

  // Garau's two transparency readouts (kept apart: the book ranks neither on one scale)
  /** 8: degree of transparency from the role of the veil colour in P and Q. */
  readonly degreeOfTransparency: TransparencyDegree | null;
  /** 6: balance of the P–Q pair; null when P and Q are not two tertiaries. */
  readonly balance: BalanceReading | null;
  /** The P–Q juxtaposition type; null when P and Q are not two tertiaries. */
  readonly juxtapositionType: JuxtapositionType | null;
  /** The P–Q relation when they are not two tertiaries. */
  readonly pairRelation: NonTertiaryRelation | null;
}
