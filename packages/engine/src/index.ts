/**
 * @garau/engine — the framework-agnostic color engine for Augusto Garau's
 * perceptual color transparency theory.
 *
 * In memory of Professor Augusto Garau (1923–2010).
 *
 * This package is the single source of truth for the color math. It is imported
 * verbatim by the web studio (`apps/web`) and, later, by the Photoshop UXP
 * plugin (`apps/photoshop`). No framework or DOM dependencies.
 */

export type {
  RGB,
  NormalizedRGB,
  HSL,
  Lab,
  LCH,
  OKLab,
  OKLCH,
  DominantPrimary,
  GarauMixture,
  JuxtapositionType,
  HarmonyCategory,
  JuxtapositionAnalysis,
  TertiaryJuxtaposition,
  NonTertiaryPair,
  NonTertiaryRelation,
  TransparencyDegree,
  BalanceReading,
  TransparencyConfig,
  MetelliResult,
  ValidationReport,
} from './types.js';

export {
  rgb,
  rgbToNormalized,
  normalizedToRgb,
  rgbToLinear,
  linearToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  labToRgb,
  rgbToLch,
  lchToRgb,
  rgbToHex,
  hexToRgb,
  interpolateRgb,
  getLuminance,
  getContrastRatio,
} from './conversions.js';

export {
  rgbToOklab,
  oklabToRgb,
  isOklabInGamut,
  oklabToOklch,
  oklchToOklab,
  rgbToOklch,
  oklchToRgb,
  oklchMaxChroma,
  NEUTRAL_CHROMA_FLOOR,
  SRGB_CHROMA_CEILING,
} from './oklab.js';

export {
  compositeVeil,
  computeForward,
  computeInverse,
  computeDesigner,
  suggestTransparencyCoefficient,
  suggestTransparentColor,
  DA_POS_ALPHA_TOLERANCE,
} from './metelli.js';

export {
  analyzeVisualMixture,
  getComplementaryMixture,
  findSharedSubordinatePartner,
  normalizeHue,
  hueDistance,
  oklchHueToRyb,
  rybToOklchHue,
  isTertiary,
  mixtureComponents,
  ACHROMATIC_CHROMA,
  GARAU_CIRCLE,
  garauDiskPlace,
  garauDiskColour,
} from './visualMixture.js';
export type { GarauCircleColour } from './visualMixture.js';

export {
  classifyJuxtaposition,
  pairLabel,
  roleOf,
  sharedColours,
  degreeFromRoles,
} from './juxtaposition.js';

export type { ColourRole } from './juxtaposition.js';

export {
  validateTransparency,
  getValiditySummary,
} from './validation.js';

export { checkMetelliConditions } from './metelliConditions.js';

export type { MetelliConditions } from './metelliConditions.js';

export { borderRelation, canCrown, explainBorder, solveContinuum } from './continuum.js';
export type {
  BorderRelation,
  ContinuumBorder,
  ContinuumGraph,
  ContinuumPlan,
  ContinuumSolution,
} from './continuum.js';
