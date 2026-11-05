import { describe, it, expect } from 'vitest';
import {
  analyzeVisualMixture,
  classifyJuxtaposition,
  hueDistance,
  normalizeHue,
} from '../src/index.js';
import type { RGB } from '../src/index.js';

describe('analyzeVisualMixture — Garau notation', () => {
  it("Garau's red is dominant R, pure", () => {
    const m = analyzeVisualMixture({ r: 200, g: 70, b: 80 });
    expect(m.dominant).toBe('R');
    expect(m.isPure).toBe(true);
    expect(m.notation).toBe('R');
    expect(m.splittability).toBe(0);
  });

  it("Garau's yellow is dominant Y, pure", () => {
    const m = analyzeVisualMixture({ r: 255, g: 220, b: 86 });
    expect(m.dominant).toBe('Y');
    expect(m.isPure).toBe(true);
  });

  it('orange is a balanced R–Y mixture', () => {
    const m = analyzeVisualMixture({ r: 255, g: 128, b: 0 }); // hue ~30
    expect(m.isBalanced).toBe(true);
    expect(new Set(m.notation.toUpperCase().split(''))).toEqual(new Set(['R', 'Y']));
    // balanced mixtures resist splitting
    expect(m.splittability).toBeLessThan(0.5);
  });

  it('an unbalanced mixture splits more easily than a balanced one', () => {
    const balanced = analyzeVisualMixture({ r: 255, g: 128, b: 0 }); // orange
    const unbalanced = analyzeVisualMixture({ r: 255, g: 80, b: 0 }); // reddish orange
    expect(unbalanced.splittability).toBeGreaterThan(balanced.splittability);
  });
});

describe('classifyJuxtaposition', () => {
  it('classifies a tertiary pair with a balance score in range', () => {
    const P: RGB = { r: 233, g: 124, b: 72 }; // yR
    const Q: RGB = { r: 0, g: 183, b: 166 }; // yB
    const analysis = classifyJuxtaposition(P, Q);
    if (analysis.kind !== 'tertiary') throw new Error('expected two tertiaries');
    expect(['Shared Subordinate', 'Shared Dominant', 'Complete Inversion', 'Partial Inversion'])
      .toContain(analysis.type);
    expect(analysis.balance.score).toBeGreaterThanOrEqual(0);
    expect(analysis.balance.score).toBeLessThanOrEqual(100);
  });
});

describe('harmony grouping (concord / discord)', () => {
  // bY and bR share subordinate blue → complementary → balanced concord.
  it('a shared-subordinate pair is a balanced concord', () => {
    const bY = { r: 120, g: 150, b: 210 }; // bluish yellow-ish (dominant Y, subordinate b)
    const bR = { r: 150, g: 60, b: 150 }; // bluish red (dominant R, subordinate b)
    const a = classifyJuxtaposition(bY, bR);
    if (a.kind === 'tertiary' && a.type === 'Shared Subordinate') expect(a.harmony).toBe('Balanced concord');
  });

  it('each juxtaposition type maps to the book grouping, and pure colors are neutral', () => {
    const concord = new Set(['Complete Inversion', 'Shared Subordinate']);
    const discord = new Set(['Shared Dominant', 'Partial Inversion']);
    const samples: [RGB, RGB][] = [
      [{ r: 210, g: 120, b: 40 }, { r: 60, g: 130, b: 180 }],
      [{ r: 150, g: 60, b: 150 }, { r: 90, g: 90, b: 200 }],
      [{ r: 200, g: 90, b: 60 }, { r: 60, g: 90, b: 200 }],
      [{ r: 230, g: 200, b: 40 }, { r: 40, g: 120, b: 200 }],
    ];
    for (const [x, y] of samples) {
      const a = classifyJuxtaposition(x, y);
      if (a.kind === 'non-tertiary') {
        expect(a.harmony).toBe('Neutral');
      } else if (concord.has(a.type)) {
        expect(a.harmony).toBe('Balanced concord');
      } else if (discord.has(a.type)) {
        expect(a.harmony).toBe('Unbalanced discord');
      }
    }
  });

  it('a pair involving a pure primary is neutral (grouping does not apply)', () => {
    const pureRed = { r: 255, g: 0, b: 0 };
    const bluishRed = { r: 150, g: 60, b: 150 };
    const a = classifyJuxtaposition(pureRed, bluishRed);
    expect(a.harmony).toBe('Neutral');
  });
});

describe('hue helpers', () => {
  it('normalizes negative and >360 hues', () => {
    expect(normalizeHue(-30)).toBeCloseTo(330, 5);
    expect(normalizeHue(390)).toBeCloseTo(30, 5);
  });
  it('takes the shortest angular path', () => {
    expect(hueDistance(350, 10)).toBeCloseTo(20, 5);
  });
});
