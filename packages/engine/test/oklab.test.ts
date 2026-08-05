/**
 * Reference values are Björn Ottosson's own published sRGB→OKLab numbers
 * ("A perceptual color space for image processing", 2020) — the same
 * literals Nino's `OKLabTests.swift` checks against, so the TypeScript and
 * Swift implementations are verified against one shared, external source
 * rather than against each other.
 */
import { describe, it, expect } from 'vitest';
import {
  rgbToOklab,
  oklabToRgb,
  rgbToOklch,
  oklchToRgb,
  isOklabInGamut,
  oklchMaxChroma,
  NEUTRAL_CHROMA_FLOOR,
} from '../src/index.js';
import type { RGB, OKLab } from '../src/index.js';

const close = (a: number, b: number, tol = 1e-3): boolean => Math.abs(a - b) <= tol;

describe('sRGB → OKLab reference values', () => {
  const cases: Array<{ name: string; rgb: RGB; oklab: OKLab }> = [
    { name: 'red', rgb: { r: 255, g: 0, b: 0 }, oklab: { L: 0.62796, a: 0.22486, b: 0.12585 } },
    { name: 'green', rgb: { r: 0, g: 255, b: 0 }, oklab: { L: 0.86644, a: -0.23389, b: 0.1795 } },
    { name: 'blue', rgb: { r: 0, g: 0, b: 255 }, oklab: { L: 0.45201, a: -0.03246, b: -0.31153 } },
  ];

  for (const c of cases) {
    it(`converts ${c.name}`, () => {
      const got = rgbToOklab(c.rgb);
      expect(close(got.L, c.oklab.L)).toBe(true);
      expect(close(got.a, c.oklab.a)).toBe(true);
      expect(close(got.b, c.oklab.b)).toBe(true);
    });
  }

  it('black and white are neutral', () => {
    const black = rgbToOklab({ r: 0, g: 0, b: 0 });
    const white = rgbToOklab({ r: 255, g: 255, b: 255 });
    expect(close(black.L, 0, 1e-4)).toBe(true);
    expect(close(white.L, 1, 1e-4)).toBe(true);
    expect(close(black.a, 0, 1e-4) && close(black.b, 0, 1e-4)).toBe(true);
    expect(close(white.a, 0, 1e-4) && close(white.b, 0, 1e-4)).toBe(true);
  });
});

describe('round trips', () => {
  const samples: RGB[] = [
    { r: 200, g: 40, b: 90 },
    { r: 12, g: 180, b: 220 },
    { r: 128, g: 128, b: 128 },
    { r: 255, g: 200, b: 0 },
    { r: 1, g: 254, b: 3 },
  ];

  it('OKLab round-trips within 1/255', () => {
    for (const c of samples) {
      const back = oklabToRgb(rgbToOklab(c));
      expect(Math.abs(back.r - c.r) <= 1 && Math.abs(back.g - c.g) <= 1 && Math.abs(back.b - c.b) <= 1).toBe(true);
    }
  });

  it('OKLCH round-trips within 1/255', () => {
    for (const c of samples) {
      const back = oklchToRgb(rgbToOklch(c));
      expect(Math.abs(back.r - c.r) <= 1 && Math.abs(back.g - c.g) <= 1 && Math.abs(back.b - c.b) <= 1).toBe(true);
    }
  });
});

describe('gamut', () => {
  it('reports pure sRGB primaries as in-gamut', () => {
    expect(isOklabInGamut(rgbToOklab({ r: 255, g: 0, b: 0 }))).toBe(true);
    expect(isOklabInGamut(rgbToOklab({ r: 0, g: 0, b: 0 }))).toBe(true);
  });

  it('reports an out-of-gamut OKLab point as out of gamut', () => {
    // High lightness with large chroma has no sRGB representation.
    expect(isOklabInGamut({ L: 0.95, a: 0.3, b: 0.3 })).toBe(false);
  });

  it('oklchMaxChroma finds a boundary that is itself in gamut, and a step beyond is not', () => {
    for (const h of [0, 60, 120, 180, 240, 300]) {
      const L = 0.6;
      const max = oklchMaxChroma(L, h);
      expect(max).toBeGreaterThan(0);
      expect(isOklabInGamut({ L, a: max * Math.cos((h * Math.PI) / 180), b: max * Math.sin((h * Math.PI) / 180) })).toBe(
        true,
      );
      const beyond = max + 0.01;
      expect(
        isOklabInGamut({ L, a: beyond * Math.cos((h * Math.PI) / 180), b: beyond * Math.sin((h * Math.PI) / 180) }),
      ).toBe(false);
    }
  });

  it('max chroma at L=0 and L=1 is ~0 (black and white have no room to be chromatic)', () => {
    expect(oklchMaxChroma(0, 90)).toBeLessThan(0.01);
    expect(oklchMaxChroma(1, 90)).toBeLessThan(0.01);
  });
});

describe('neutral chroma floor', () => {
  it('a pure grey reports hue 0 rather than numerical noise', () => {
    const grey = rgbToOklch({ r: 128, g: 128, b: 128 });
    expect(grey.C).toBeLessThan(NEUTRAL_CHROMA_FLOOR * 100); // generous — just "very small"
    expect(grey.h).toBe(0);
  });
});
