// Catches a disk whose R/Y/B labels, plotted colours and painted colours
// disagree (it was an sRGB hue wheel labelled with Garau's primaries).
import { describe, it, expect } from 'vitest';
import { analyzeVisualMixture, hexToRgb } from '@garau/engine';
import { ANCHORS, diskColour, diskPosition } from '../src/lib/rybDisk';

const angleOf = (label: string): number => ANCHORS.find((a) => a.label === label)!.angle;
const gap = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};
const ANGLE_TOLERANCE = 1;

describe('the Analyzer disk is Garau’s RYB disk', () => {
  it('places R, Y and B 120° apart', () => {
    expect(gap(angleOf('R'), angleOf('Y'))).toBeCloseTo(120, 6);
    expect(gap(angleOf('Y'), angleOf('B'))).toBeCloseTo(120, 6);
    expect(gap(angleOf('B'), angleOf('R'))).toBeCloseTo(120, 6);
  });

  it.each([
    ['#C84650', 'R'],
    ['#FFDC56', 'Y'],
    ['#567F9A', 'B'],
    ['#F9892C', 'RY'],
    ['#84BB81', 'YB'],
    ['#623D5D', 'BR'],
  ])('plots %s at its %s label', (hex, label) => {
    expect(gap(diskPosition(hexToRgb(hex)).angle, angleOf(label))).toBeLessThan(ANGLE_TOLERANCE);
  });

  it.each(ANCHORS.map((a) => [a.label, a.angle] as const))(
    'paints the colour the engine reads as %s at that label',
    (label, angle) => {
      expect(analyzeVisualMixture(diskColour(angle, 1)).notation).toBe(label);
    },
  );
});
