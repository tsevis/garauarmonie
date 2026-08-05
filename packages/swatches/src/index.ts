/**
 * @garau/swatches — Augusto, an open, theory-grounded colour swatch system
 * generated from `@garau/engine`. See `documents/OpenColorSystem-Proposal.md`
 * in the Nino repo for the full architecture.
 */

export type { Swatch, SwatchArtifact, SwatchName, SwatchGarau } from './types.js';
export { enumerateGrid, DEFAULT_GRID_OPTIONS, ACHROMATIC_CHROMA } from './grid.js';
export type { GridOptions, GridPoint } from './grid.js';
export { decompose } from './decompose.js';
export { nameOklch } from './name.js';
export type { HueFamily } from './name.js';
export { codeFor } from './code.js';
export { buildArtifact, GRID_VERSION } from './build.js';
