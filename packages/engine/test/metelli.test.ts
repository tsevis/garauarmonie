import { describe, it, expect } from 'vitest';
import {
  compositeVeil,
  computeForward,
  computeInverse,
  computeDesigner,
  suggestTransparencyCoefficient,
  suggestTransparentColor,
  checkMetelliConditions,
  getLuminance,
} from '../src/index.js';
import type { RGB } from '../src/index.js';

const near = (a: number, b: number, tol = 2): boolean => Math.abs(a - b) <= tol;
const rgbNear = (a: RGB, b: RGB, tol = 2): boolean =>
  near(a.r, b.r, tol) && near(a.g, b.g, tol) && near(a.b, b.b, tol);

const A: RGB = { r: 220, g: 60, b: 60 }; // red-ish background
const B: RGB = { r: 60, g: 90, b: 210 }; // blue-ish background
const t: RGB = { r: 240, g: 230, b: 120 }; // yellow-ish transparent layer

describe('Metelli forward/inverse', () => {
  it('forward then inverse recovers t and alpha', () => {
    const alpha = 0.4;
    const fwd = computeForward(A, B, t, alpha);
    const inv = computeInverse(A, B, fwd.P, fwd.Q);
    expect(near(inv.alpha, alpha, 0.02)).toBe(true);
    expect(rgbNear(inv.t, t, 3)).toBe(true);
  });

  it('overlap equals background at alpha=1 (opaque)', () => {
    const fwd = computeForward(A, B, t, 1);
    expect(rgbNear(fwd.P, A)).toBe(true);
    expect(rgbNear(fwd.Q, B)).toBe(true);
  });

  it('overlap equals transparent color at alpha=0 (fully transparent)', () => {
    const fwd = computeForward(A, B, t, 0);
    expect(rgbNear(fwd.P, t)).toBe(true);
    expect(rgbNear(fwd.Q, t)).toBe(true);
  });

  it('accepts a well-formed forward composition without warnings', () => {
    // A veil always reduces contrast, so a forward result must never trip the
    // contrast-reduction condition (the regression this replaced did exactly that).
    const fwd = computeForward(A, B, t, 0.4);
    expect(fwd.warnings).toEqual([]);
    expect(fwd.valid).toBe(true);
  });

  it('warns in forward mode when the backgrounds are identical', () => {
    const fwd = computeForward(A, A, t, 0.4);
    expect(fwd.valid).toBe(false);
    expect(fwd.warnings.join(' ')).toContain('identical');
  });

  it('accepts a genuine four-zone display without warnings', () => {
    const fwd = computeForward(A, B, t, 0.4);
    const inv = computeInverse(A, B, fwd.P, fwd.Q);
    expect(inv.warnings).toEqual([]);
    expect(inv.valid).toBe(true);
  });

  it('agrees with checkMetelliConditions on contrast reduction', () => {
    const fwd = computeForward(A, B, t, 0.4);
    const inv = computeInverse(A, B, fwd.P, fwd.Q);
    const conditions = checkMetelliConditions(A, B, fwd.P, fwd.Q, inv.alpha);
    expect(conditions.contrastReduction).toBe(true);
    expect(conditions.topologyPreserved).toBe(true);
    // The veil brings the overlaps closer together than the backgrounds are.
    expect(Math.abs(getLuminance(fwd.P) - getLuminance(fwd.Q))).toBeLessThan(
      Math.abs(getLuminance(A) - getLuminance(B)),
    );
    expect(inv.warnings).toEqual([]);
  });

  it('warns when the overlaps have more contrast than the backgrounds', () => {
    // Hand-built, physically impossible display: overlaps further apart than A/B.
    const nearA: RGB = { r: 130, g: 130, b: 130 };
    const nearB: RGB = { r: 150, g: 150, b: 150 };
    const farP: RGB = { r: 20, g: 20, b: 20 };
    const farQ: RGB = { r: 240, g: 240, b: 240 };
    const inv = computeInverse(nearA, nearB, farP, farQ);
    expect(inv.valid).toBe(false);
    expect(inv.warnings.join(' ')).toContain('Contrast reduction violated');
  });

  it('warns when the lighter overlap sits over the darker background', () => {
    const darkA: RGB = { r: 40, g: 40, b: 40 };
    const lightB: RGB = { r: 220, g: 220, b: 220 };
    const fwd = computeForward(darkA, lightB, t, 0.4);
    // Swap the overlaps: topology broken, contrast still reduced.
    const inv = computeInverse(darkA, lightB, fwd.Q, fwd.P);
    expect(inv.valid).toBe(false);
    expect(inv.warnings.join(' ')).toContain('Topology violated');
  });

  it('warns when the display is opaque (no scission)', () => {
    const inv = computeInverse(A, B, A, B); // P = A, Q = B → nothing is veiled
    expect(inv.valid).toBe(false);
    expect(inv.warnings.join(' ')).toContain('Scission not realizable');
  });

  it('warns when backgrounds are identical in inverse mode', () => {
    const inv = computeInverse(A, A, A, A);
    expect(inv.valid).toBe(false);
    expect(inv.warnings.join(' ')).toContain('identical');
  });
});

describe('suggestTransparencyCoefficient', () => {
  it('recovers the alpha used to build the overlaps', () => {
    const alpha = 0.55;
    const fwd = computeForward(A, B, t, alpha);
    const suggested = suggestTransparencyCoefficient(A, B, fwd.P, fwd.Q);
    expect(near(suggested, alpha, 0.03)).toBe(true);
  });
});

describe('computeDesigner', () => {
  it('returns the requested number of ascending-alpha samples', () => {
    const results = computeDesigner(A, B, t, [0.2, 0.8], 5);
    expect(results).toHaveLength(5);
    expect(results[0]!.alpha).toBeCloseTo(0.2, 5);
    expect(results[4]!.alpha).toBeCloseTo(0.8, 5);
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i]!.alpha).toBeGreaterThan(results[i - 1]!.alpha);
    }
  });
});

describe('suggestTransparentColor', () => {
  it('returns six candidate colors', () => {
    expect(suggestTransparentColor(A, B)).toHaveLength(6);
  });
});

describe('compositeVeil (stacking)', () => {
  it('equals the forward overlap for a single veil over one base', () => {
    const alpha = 0.4;
    const { P } = computeForward(A, A, t, alpha); // A over A → single-base composite
    expect(rgbNear(compositeVeil(A, t, alpha), P)).toBe(true);
  });

  it('at α=1 keeps the base; at α=0 becomes the veil', () => {
    expect(rgbNear(compositeVeil(A, t, 1), A)).toBe(true);
    expect(rgbNear(compositeVeil(A, t, 0), t)).toBe(true);
  });

  it('stacking two veils composites in order', () => {
    const once = compositeVeil(A, t, 0.5);
    const twice = compositeVeil(once, B, 0.5);
    // second layer averages the first result with the new veil color B
    expect(rgbNear(twice, compositeVeil(compositeVeil(A, t, 0.5), B, 0.5))).toBe(true);
  });
});
