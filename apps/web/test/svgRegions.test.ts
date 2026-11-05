// Borders come from an ID raster; an anti-aliased seam between two shapes must not hide their border.
import { describe, it, expect } from 'vitest';
import { countBorders, idToRgb, rgbToId } from '../src/lib/svgRegions';

// 6 x 2 raster: shape 1 | seam (0) | shape 2, and shape 3 touching shape 2 only at a corner.
function raster(rows: number[][]): { ids: Uint32Array; w: number; h: number } {
  return { ids: Uint32Array.from(rows.flat()), w: rows[0]!.length, h: rows.length };
}

describe('countBorders', () => {
  it('counts a border across a one-pixel seam', () => {
    const { ids, w, h } = raster([
      [1, 1, 0, 2, 2],
      [1, 1, 0, 2, 2],
    ]);
    expect(countBorders(ids, w, h, 1).get('1|2')).toBe(2);
  });

  it('does not join shapes that only meet at a corner', () => {
    const { ids, w, h } = raster([
      [1, 1, 0, 0],
      [0, 0, 3, 3],
    ]);
    expect(countBorders(ids, w, h, 1).has('1|3')).toBe(false);
  });

  it('drops borders shorter than the minimum', () => {
    const { ids, w, h } = raster([
      [1, 2],
      [1, 1],
    ]);
    expect(countBorders(ids, w, h, 3).size).toBe(0);
  });
});

describe('ID colours', () => {
  it('round-trip for many shapes', () => {
    for (const id of [1, 255, 256, 70000]) expect(rgbToId(...idToRgb(id))).toBe(id);
  });
});
