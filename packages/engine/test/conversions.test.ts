import { describe, it, expect } from 'vitest';
import {
  rgb,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToLch,
  lchToRgb,
  getLuminance,
  getContrastRatio,
} from '../src/index.js';
import type { RGB } from '../src/index.js';

const near = (a: number, b: number, tol = 2): boolean => Math.abs(a - b) <= tol;

describe('hex conversions', () => {
  it('round-trips through hex', () => {
    const c = rgb(18, 52, 86);
    expect(rgbToHex(c)).toBe('#123456');
    expect(hexToRgb('#123456')).toEqual(c);
  });

  it('expands shorthand hex', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe('HSL round-trip', () => {
  const samples: RGB[] = [
    { r: 200, g: 40, b: 90 },
    { r: 12, g: 180, b: 220 },
    { r: 128, g: 128, b: 128 },
    { r: 255, g: 200, b: 0 },
  ];
  it('recovers RGB within 2/255 after HSL round-trip', () => {
    for (const c of samples) {
      const back = hslToRgb(rgbToHsl(c));
      expect(near(back.r, c.r) && near(back.g, c.g) && near(back.b, c.b)).toBe(true);
    }
  });
});

describe('LCH round-trip', () => {
  const samples: RGB[] = [
    { r: 200, g: 40, b: 90 },
    { r: 12, g: 180, b: 220 },
    { r: 240, g: 240, b: 30 },
  ];
  it('recovers RGB within 3/255 after LCH round-trip', () => {
    for (const c of samples) {
      const back = lchToRgb(rgbToLch(c));
      expect(near(back.r, c.r, 3) && near(back.g, c.g, 3) && near(back.b, c.b, 3)).toBe(true);
    }
  });
});

describe('luminance & contrast', () => {
  it('white is brighter than black', () => {
    expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(getLuminance({ r: 0, g: 0, b: 0 }));
  });
  it('black/white contrast is 21:1', () => {
    const ratio = getContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(near(ratio, 21, 0.1)).toBe(true);
  });
});
