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
  TransparencyConfig,
  MetelliResult,
  ValidationReport,
} from './types.js';

export {
  rgb,
  rgbToNormalized,
  normalizedToRgb,
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
} from './metelli.js';

export {
  analyzeVisualMixture,
  classifyJuxtaposition,
  getComplementaryMixture,
  findSharedSubordinatePartner,
  normalizeHue,
  hueDistance,
} from './visualMixture.js';

export {
  checkMetelliConditions,
  validateTransparency,
  getValiditySummary,
} from './validation.js';

export type { MetelliConditions } from './validation.js';
