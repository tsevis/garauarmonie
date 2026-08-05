/**
 * Renders the generated grid as an HTML contact sheet — "judge by eye, on a
 * contact sheet, before you judge by a number" (Nino's `ColorLessons.md`
 * §6), the same verification method this project uses for every other
 * colour-density decision, applied here to a brand-new grid rather than to
 * an existing library.
 *
 * Run via `npm run contact-sheet --workspace @garau/swatches`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildArtifact } from './build.js';

function main(): void {
  const artifact = buildArtifact();
  const achromatic = artifact.swatches.filter((s) => s.garau === null);
  const chromatic = artifact.swatches.filter((s) => s.garau !== null);

  // Group chromatic swatches by hue bucket (embedded in the code's second segment), sorted by lightness within each hue.
  const byHue = new Map<string, typeof chromatic>();
  for (const s of chromatic) {
    const hueBucket = s.code.split('-')[1] ?? '??';
    const list = byHue.get(hueBucket) ?? [];
    list.push(s);
    byHue.set(hueBucket, list);
  }
  const hueRows = [...byHue.entries()].sort(([a], [b]) => a.localeCompare(b));

  const swatchCell = (hex: string, label: string): string =>
    `<div class="swatch" style="background:${hex}" title="${label}"><span>${label}</span></div>`;

  const achromaticRow = achromatic
    .slice()
    .sort((a, b) => a.oklch.L - b.oklch.L)
    .map((s) => swatchCell(s.srgbHex, `${s.code} · ${s.name.full}`))
    .join('');

  const chromaticRows = hueRows
    .map(
      ([hueBucket, list]) =>
        `<div class="row"><span class="rowLabel">hue ${hueBucket}</span>${list
          .slice()
          .sort((a, b) => a.oklch.L - b.oklch.L || a.oklch.C - b.oklch.C)
          .map((s) => swatchCell(s.srgbHex, `${s.code} · ${s.name.full}`))
          .join('')}</div>`,
    )
    .join('\n');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Augusto v${artifact.gridVersion} — contact sheet</title>
<style>
  body { font: 12px -apple-system, sans-serif; background: #1c1c1e; color: #eee; margin: 0; padding: 16px; }
  h1 { font-size: 14px; font-weight: 600; }
  .row { display: flex; align-items: center; margin-bottom: 2px; }
  .rowLabel { width: 64px; flex: none; color: #999; font-size: 10px; }
  .swatch { width: 28px; height: 28px; flex: none; position: relative; }
  .swatch span { display: none; }
  .count { color: #999; margin-bottom: 12px; }
</style></head>
<body>
  <h1>Augusto v${artifact.gridVersion}</h1>
  <p class="count">${artifact.swatches.length} swatches — ${achromatic.length} achromatic, ${chromatic.length} chromatic — ${artifact.hueBins}×${artifact.lightnessBins}×${artifact.chromaBins} grid</p>
  <div class="row"><span class="rowLabel">neutral</span>${achromaticRow}</div>
  ${chromaticRows}
</body></html>
`;

  const here = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(here, '..', 'dist');
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'contact-sheet.html');
  writeFileSync(outFile, html, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`contact sheet → ${outFile}`);
}

main();
