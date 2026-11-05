// Catches a disk painted in screen colours: its rim must be Garau's circle.
import { describe, it, expect } from 'vitest';
import { GARAU_CIRCLE, hexToRgb, rgbToOklab } from '@garau/engine';
import { diskColour, diskAngleOfRyb } from '../src/lib/rybDisk';

const MAX_DE = 0.02; // OKLab distance, well under one step of the circle (about 0.1)

describe('the Analyzer disk is painted in Garau’s colours', () => {
  it('each of the twelve rim places shows the colour of the circle', () => {
    const off = GARAU_CIRCLE.filter(({ hex, ryb }) => {
      const a = rgbToOklab(diskColour(diskAngleOfRyb(ryb), 1));
      const b = rgbToOklab(hexToRgb(hex));
      return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b) > MAX_DE;
    }).map((c) => c.notation);
    expect(off).toEqual([]);
  });
});
