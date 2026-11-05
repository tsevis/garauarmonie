import { describe, it, expect } from 'vitest';
import { classifyJuxtaposition, hexToRgb } from '../src/index.js';
import type { JuxtapositionAnalysis, TertiaryJuxtaposition } from '../src/index.js';

// Tertiaries placed on the RYB disk (yR 40, rY 80, bY 160, yB 200, rB 280, bR 320).
const T = {
  yR: '#E97C48',
  rY: '#D78C00',
  bY: '#7BB145',
  yB: '#00B7A6',
  rB: '#B783E7',
  bR: '#E174AE',
} as const;

const pair = (a: string, b: string): JuxtapositionAnalysis =>
  classifyJuxtaposition(hexToRgb(a), hexToRgb(b));

/** The pair as a tertiary reading; fails the test when it is not one. */
function tertiary(a: string, b: string): TertiaryJuxtaposition {
  const r = pair(a, b);
  if (r.kind !== 'tertiary') throw new Error(`${a} + ${b} did not read as two tertiaries`);
  return r;
}

describe('the four types apply only between two tertiaries (audit 4)', () => {
  it.each([
    ['#FFDC56', '#567F9A', 'Two primaries'],
    ['#C84650', '#F9892C', 'Primary and mixture'],
    ['#FFDC56', '#623D5D', 'Complementary'],
    ['#808080', T.yR, 'Achromatic'],
    ['#F9892C', T.yB, 'Balanced secondary'],
  ])('%s + %s is a non-tertiary pair (%s), with no type and no score', (a, b, relation) => {
    const r = pair(a, b);
    expect(r.kind).toBe('non-tertiary');
    expect(r.kind === 'non-tertiary' && r.relation).toBe(relation);
    expect('type' in r).toBe(false);
    expect('transparencyQuality' in r).toBe(false);
    expect('degree' in r).toBe(false);
  });
});

describe('degree of transparency follows condition 8, not a blended score (audit 8)', () => {
  it('shared subordinate reads very transparent', () => {
    const r = tertiary(T.rY, T.rB);
    expect(r.type).toBe('Shared Subordinate');
    expect(r.degree).toBe('Very transparent');
  });

  it('shared dominant reads nearly opaque', () => {
    const r = tertiary(T.yR, T.bR);
    expect(r.type).toBe('Shared Dominant');
    expect(r.degree).toBe('Nearly opaque');
  });

  it('a tertiary pair carries no single quality score', () => {
    expect('transparencyQuality' in tertiary(T.rY, T.rB)).toBe(false);
  });
});

describe('balance is a separate readout (condition 6)', () => {
  it.each([
    [T.rY, T.rB, true],
    [T.yR, T.bR, true],
    [T.yR, T.rY, false],
    [T.yR, T.rB, false],
  ])('%s + %s balanced = %s', (a, b, balanced) => {
    expect(tertiary(a, b).balance.balanced).toBe(balanced);
  });

  it('the 2:1 shared-subordinate pair scores higher balance than the 2:1 complete inversion', () => {
    expect(tertiary(T.rY, T.rB).balance.score).toBeGreaterThan(tertiary(T.yR, T.rY).balance.score);
  });
});
