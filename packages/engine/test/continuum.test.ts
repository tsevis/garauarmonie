// The continuum solver colours shapes by Garau's rules (Color Harmonies, ch. 1).
// These tests catch the readings a naive "shares a primary, so it binds" rule gets wrong.
import { describe, it, expect } from 'vitest';
import {
  borderRelation,
  canCrown,
  explainBorder,
  solveContinuum,
  type ContinuumGraph,
} from '../src/continuum.js';

describe('borderRelation', () => {
  it('partial inversion divides although the two colours share a primary', () => {
    expect(borderRelation('yR', 'rB')).toBe('divide');
  });

  it('complete inversion, shared subordinate and shared dominant bind', () => {
    expect(borderRelation('yR', 'rY')).toBe('bind');
    expect(borderRelation('yR', 'yB')).toBe('bind');
    expect(borderRelation('yR', 'bR')).toBe('bind');
  });

  it('colours with no primary in common contrast', () => {
    expect(borderRelation('Y', 'BR')).toBe('contrast');
    expect(borderRelation('rY', 'B')).toBe('contrast');
  });

  it('a colour beside itself is a repeat', () => {
    expect(borderRelation('bY', 'bY')).toBe('repeat');
  });
});

describe('canCrown', () => {
  it('follows plates 6-8: yellow over all six, red over three, blue over two', () => {
    expect(['bY', 'YB', 'yB', 'yR', 'RY', 'rY'].every((m) => canCrown('Y', m))).toBe(true);
    expect(['bR', 'BR', 'rB'].every((m) => canCrown('R', m))).toBe(true);
    expect(canCrown('R', 'yR')).toBe(false);
    expect(canCrown('B', 'bR')).toBe(false);
    expect(canCrown('B', 'yB')).toBe(false);
  });
});

describe('explainBorder', () => {
  it('names the juxtaposition and what it does', () => {
    expect(explainBorder('yR', 'rB')).toBe('yR | rB · partial inversion · divides');
    expect(explainBorder('yR', 'rY')).toBe('yR | rY · complete inversion · binds');
  });
});

// a - b - c in one area, c - d across into a second area.
const chain: ContinuumGraph = {
  regions: ['a', 'b', 'c', 'd'],
  borders: [
    { a: 'a', b: 'b', length: 10 },
    { a: 'b', b: 'c', length: 10 },
    { a: 'c', b: 'd', length: 10 },
  ],
};
const groups = { a: 'one', b: 'one', c: 'one', d: 'two' };

describe('solveContinuum', () => {
  it('keeps locked colours and puts a pure colour only on the apex', () => {
    const [best] = solveContinuum(chain, { locks: { a: 'yR' }, apex: { region: 'b', primary: 'Y' }, groups });
    expect(best!.colours.a).toBe('yR');
    expect(best!.colours.b).toBe('Y');
    const pures = Object.entries(best!.colours).filter(([, n]) => ['R', 'Y', 'B'].includes(n));
    expect(pures).toEqual([['b', 'Y']]);
  });

  it('binds inside an area and divides or contrasts across areas', () => {
    const [best] = solveContinuum(chain, { groups });
    const c = best!.colours;
    expect(borderRelation(c.a!, c.b!)).toBe('bind');
    expect(borderRelation(c.b!, c.c!)).toBe('bind');
    expect(['divide', 'contrast']).toContain(borderRelation(c.c!, c.d!));
  });

  it('the apex neighbours are mixtures it can crown', () => {
    const [best] = solveContinuum(chain, { apex: { region: 'b', primary: 'R' }, groups });
    const c = best!.colours;
    expect(canCrown('R', c.a!)).toBe(true);
    expect(canCrown('R', c.c!)).toBe(true);
  });

  it('gives the same proposals for the same input', () => {
    const one = solveContinuum(chain, { groups, seed: 7 });
    const two = solveContinuum(chain, { groups, seed: 7 });
    expect(one).toEqual(two);
  });

  it('returns distinct proposals, best first', () => {
    const out = solveContinuum(chain, { groups, count: 4 });
    const keys = out.map((s) => JSON.stringify(s.colours));
    expect(new Set(keys).size).toBe(keys.length);
    expect(out.map((s) => s.score)).toEqual([...out.map((s) => s.score)].sort((x, y) => y - x));
  });
});
