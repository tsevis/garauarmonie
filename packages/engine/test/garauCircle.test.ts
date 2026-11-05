// Catches a hue reading built on screen colours instead of Garau's own circle:
// each of his twelve colours (cover of Le armonie del colore, equal steps) must
// read as its own place in his notation.
import { describe, it, expect } from 'vitest';
import { analyzeVisualMixture, findSharedSubordinatePartner, getComplementaryMixture, hexToRgb, rgbToHex } from '../src/index.js';

const CIRCLE: ReadonlyArray<readonly [hex: string, notation: string]> = [
  ['#FFDC56', 'Y'], ['#FFB33B', 'rY'], ['#F9892C', 'RY'], ['#ED5D2F', 'yR'],
  ['#C84650', 'R'], ['#95435D', 'bR'], ['#623D5D', 'BR'], ['#5E5C8A', 'rB'],
  ['#567F9A', 'B'], ['#5AA097', 'yB'], ['#84BB81', 'YB'], ['#C0CE69', 'bY'],
];

describe("Garau's circle", () => {
  it('every colour of the circle reads as its own notation', () => {
    const wrong = CIRCLE.map(([hex, n]) => [hex, n, analyzeVisualMixture(hexToRgb(hex)).notation])
      .filter(([, n, got]) => n !== got);
    expect(wrong).toEqual([]);
  });

  // Catches the Analyzer's swatches painted in screen colours: a colour of the
  // circle has its complement and its shared-subordinate partner on the circle too.
  const at = (i: number) => CIRCLE[((i % 12) + 12) % 12]!;
  it('the complement of a circle colour is the colour opposite it on the circle', () => {
    const wrong = CIRCLE.map(([hex], i) => [hex, rgbToHex(getComplementaryMixture(hexToRgb(hex))), at(i + 6)[0]])
      .filter(([, got, want]) => got.toUpperCase() !== want);
    expect(wrong).toEqual([]);
  });
  it('the shared-subordinate partner of a tertiary is its mirror on the circle', () => {
    const PAIRS = [['yR', 'yB'], ['rY', 'rB'], ['bY', 'bR'], ['yB', 'yR'], ['rB', 'rY'], ['bR', 'bY']];
    const hexOf = (n: string) => CIRCLE.find(([, m]) => m === n)![0];
    const wrong = PAIRS.map(([a, b]) => [a, rgbToHex(findSharedSubordinatePartner(hexToRgb(hexOf(a)))), hexOf(b)])
      .filter(([, got, want]) => got.toUpperCase() !== want);
    expect(wrong).toEqual([]);
  });
});
