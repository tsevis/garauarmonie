import { describe, it, expect } from 'vitest';
import { enumerateGrid, DEFAULT_GRID_OPTIONS, ACHROMATIC_CHROMA } from '../src/grid.js';

describe('grid enumeration', () => {
  it('emits exactly one achromatic point per lightness bucket', () => {
    const points = enumerateGrid(DEFAULT_GRID_OPTIONS);
    const achromatic = points.filter((p) => p.chromaBucket === null);
    expect(achromatic).toHaveLength(DEFAULT_GRID_OPTIONS.lightnessBins);
    for (const p of achromatic) expect(p.oklch.C).toBe(0);
  });

  it('every chromatic point is at or above the achromatic threshold', () => {
    const points = enumerateGrid(DEFAULT_GRID_OPTIONS);
    for (const p of points) {
      if (p.chromaBucket !== null) expect(p.oklch.C).toBeGreaterThanOrEqual(ACHROMATIC_CHROMA);
    }
  });

  it('chroma increases with chroma bucket at a fixed hue/lightness', () => {
    const points = enumerateGrid(DEFAULT_GRID_OPTIONS).filter((p) => p.hueBucket === 5 && p.lightnessBucket === 6);
    const sorted = points.slice().sort((a, b) => (a.chromaBucket ?? -1) - (b.chromaBucket ?? -1));
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i]!.oklch.C).toBeGreaterThan(sorted[i - 1]!.oklch.C);
    }
  });

  it('is deterministic: two enumerations of the same options produce the same list', () => {
    const a = enumerateGrid(DEFAULT_GRID_OPTIONS);
    const b = enumerateGrid(DEFAULT_GRID_OPTIONS);
    expect(a).toEqual(b);
  });

  it('a denser grid strictly contains more candidate points than a coarser one', () => {
    const coarse = enumerateGrid({ hueBins: 6, lightnessBins: 6, chromaBins: 2 });
    const fine = enumerateGrid({ hueBins: 24, lightnessBins: 12, chromaBins: 6 });
    expect(fine.length).toBeGreaterThan(coarse.length);
  });
});
