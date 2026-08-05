/**
 * The generator's orchestrator. `OpenColorSystem-Proposal.md` §7:
 * "the generation script is the source of truth, not the output file" —
 * running this against a given `GridOptions` must always produce the
 * identical artifact back, which is what `test/reproducibility.test.ts`
 * checks.
 *
 * Run via `npm run generate --workspace @garau/swatches`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { oklchToRgb, rgbToHex, oklchToOklab } from '@garau/engine';
import { enumerateGrid, DEFAULT_GRID_OPTIONS } from './grid.js';
import type { GridOptions } from './grid.js';
import { decompose } from './decompose.js';
import { nameOklch } from './name.js';
import { codeFor } from './code.js';
import type { Swatch, SwatchArtifact } from './types.js';

export const GRID_VERSION = '1.0.0';

/**
 * Builds the full artifact. Points are deduplicated by their rounded sRGB
 * hex — two adjacent buckets can round to the same eight-bit colour near
 * the gamut boundary — keeping the first in enumeration order, which is
 * itself deterministic (see `grid.ts`), so which duplicate survives is
 * stable across runs.
 */
export function buildArtifact(options: GridOptions = DEFAULT_GRID_OPTIONS, version = GRID_VERSION): SwatchArtifact {
  const seen = new Set<string>();
  const swatches: Swatch[] = [];

  for (const point of enumerateGrid(options)) {
    const rgb = oklchToRgb(point.oklch);
    const hex = rgbToHex(rgb);
    if (seen.has(hex)) continue;
    seen.add(hex);

    const garau = decompose(point.oklch);
    swatches.push({
      code: codeFor(point, garau),
      oklab: oklchToOklab(point.oklch),
      oklch: point.oklch,
      srgbHex: hex,
      garau,
      name: nameOklch(point.oklch),
    });
  }

  return {
    gridVersion: version,
    hueBins: options.hueBins,
    lightnessBins: options.lightnessBins,
    chromaBins: options.chromaBins,
    swatches,
  };
}

function main(): void {
  const artifact = buildArtifact();
  const here = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(here, '..', 'dist');
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `v${artifact.gridVersion}.json`);
  writeFileSync(outFile, `${JSON.stringify(artifact, null, 2)}\n`, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`${artifact.swatches.length} swatches → ${outFile}`);
}

// Only run when invoked directly (`node dist/build.js`), not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
