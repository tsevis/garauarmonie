import { describe, it, expect } from 'vitest';
import { analyzeVisualMixture, findSharedSubordinatePartner, hexToRgb } from '../src/index.js';
import type { GarauMixture } from '../src/index.js';

const mix = (hex: string): GarauMixture => analyzeVisualMixture(hexToRgb(hex));

describe('RYB wheel: the subordinate is the side the hue lies on', () => {
  it('crimson, a bluish red, never reads as a yellowish red', () => {
    const m = mix('#C02040');
    expect(m.dominant).toBe('R');
    expect(m.subordinate).not.toBe('Y');
  });

  it('lime #CCFF00, a greenish yellow, reads bY, not rY', () => {
    expect(mix('#CCFF00').notation).toBe('bY');
  });
});

describe('RYB wheel: balanced secondaries', () => {
  it('orange, green and purple anchors are balanced secondaries', () => {
    expect(mix('#FF8000').notation).toBe('RY');
    expect(mix('#00FF00').notation).toBe('YB');
    expect(mix('#800080').isBalanced).toBe(true);
  });
});

describe('achromatic colours', () => {
  it.each(['#808080', '#FFFFFF', '#000000'])('%s is achromatic, not pure red', (hex) => {
    const m = mix(hex);
    expect(m.isAchromatic).toBe(true);
    expect(m.notation).toBe('N');
    expect(m.splittability).toBe(0);
  });

  it('a saturated colour is not achromatic', () => {
    expect(mix('#FF0000').isAchromatic).toBe(false);
  });
});

describe('shared-subordinate partner', () => {
  it.each(['#FF5000', '#C02060', '#00FFFF'])(
    'the partner of %s shares its subordinate and has a different dominant',
    (hex) => {
      const m = mix(hex);
      const p = analyzeVisualMixture(findSharedSubordinatePartner(hexToRgb(hex)));
      expect(m.isPure).toBe(false);
      expect(p.subordinate).toBe(m.subordinate);
      expect(p.dominant).not.toBe(m.dominant);
    },
  );
});
