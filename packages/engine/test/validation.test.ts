import { describe, it, expect } from 'vitest';
import { computeForward, validateTransparency, getValiditySummary } from '../src/index.js';
import type { RGB } from '../src/index.js';

const A: RGB = { r: 220, g: 60, b: 60 };
const B: RGB = { r: 60, g: 90, b: 210 };
const t: RGB = { r: 240, g: 230, b: 120 };

describe('validateTransparency', () => {
  it('produces a full report with all condition fields', () => {
    const { P, Q } = computeForward(A, B, t, 0.4);
    const report = validateTransparency(A, B, P, Q, t, 0.4);

    expect(typeof report.overallValid).toBe('boolean');
    expect(report.fourRegions).toBe(true);
    expect(report.transparencyQuality).toBeGreaterThanOrEqual(0);
    expect(report.transparencyQuality).toBeLessThanOrEqual(100);
    expect(report.juxtapositionType).not.toBeNull();
  });

  it('a physically-consistent forward config satisfies alpha consistency', () => {
    const { P, Q } = computeForward(A, B, t, 0.4);
    const report = validateTransparency(A, B, P, Q, t, 0.4);
    // Overlaps built by the forward equations share one alpha across channels.
    expect(report.alphaConsistency).toBe(true);
    expect(report.balancedTransparency).toBe(true);
  });

  it('a forward-built transparency satisfies all three Metelli conditions', () => {
    const { P, Q } = computeForward(A, B, t, 0.4);
    const report = validateTransparency(A, B, P, Q, t, 0.4);
    // A transparency constructed by the equations (0 < α < 1) must read as a
    // valid Metelli scission — this is the regression the corrected conditions fix.
    expect(report.scissionRealizable).toBe(true);
    expect(report.topologyPreserved).toBe(true);
    expect(report.contrastReduction).toBe(true);
  });

  it('a fully opaque figure (α = 1) is not a realizable transparency', () => {
    const { P, Q } = computeForward(A, B, t, 1);
    const report = validateTransparency(A, B, P, Q, t, 1);
    expect(report.scissionRealizable).toBe(false);
    expect(report.overallValid).toBe(false);
  });

  it('flags identical backgrounds as producing a weak/invalid transparency', () => {
    const { P, Q } = computeForward(A, A, t, 0.4);
    const report = validateTransparency(A, A, P, Q, t, 0.4);
    // With A == B there is no lightness ordering to satisfy.
    expect(report.overallValid).toBe(false);
  });

  it('summary string reflects validity and quality', () => {
    const { P, Q } = computeForward(A, B, t, 0.4);
    const report = validateTransparency(A, B, P, Q, t, 0.4);
    const summary = getValiditySummary(report);
    expect(summary).toContain('Transparency quality:');
    expect(summary).toMatch(/Valid|Invalid/);
  });
});
