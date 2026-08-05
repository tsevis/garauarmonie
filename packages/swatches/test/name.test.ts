/**
 * Spot-checks against `Sources/NinoCore/Color/ColorNaming.swift`'s own
 * behaviour in the Nino repo — this is a faithful port, so the two should
 * agree on every case, not just these.
 */
import { describe, it, expect } from 'vitest';
import { nameOklch } from '../src/name.js';

describe('nameOklch', () => {
  it('names a near-neutral colour by lightness, not hue', () => {
    const name = nameOklch({ L: 0.05, C: 0.01, h: 200 });
    expect(name.family).toBe('black');
    expect(name.aliases).toEqual([]);
  });

  it('names a vivid, deep red with the maroon alias', () => {
    const name = nameOklch({ L: 0.3, C: 0.2, h: 29 });
    expect(name.family).toBe('red');
    expect(name.aliases).toContain('maroon');
  });

  it('drops "mid"/"normal" as modifiers since they add nothing to the name', () => {
    const name = nameOklch({ L: 0.55, C: 0.1, h: 264 }); // mid lightness, normal saturation, blue hue
    expect(name.full).toBe('blue');
  });

  it('a dark, muted blue gets the navy alias', () => {
    const name = nameOklch({ L: 0.3, C: 0.08, h: 264 });
    expect(name.family).toBe('blue');
    expect(name.aliases).toContain('navy');
  });
});
