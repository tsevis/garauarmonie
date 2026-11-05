import { describe, it, expect } from 'vitest';
import { computeForward, computeInverse, getLuminance } from '../src/index.js';
import type { RGB } from '../src/index.js';

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };
/** Linear luminance 0.5: the grey a half-open episcotister makes of white. */
const HALF_GREY: RGB = { r: 188, g: 188, b: 188 };
const LUMINANCE_TOLERANCE = 0.01;
const ALPHA_TOLERANCE = 0.01;

describe('Metelli in linear light: α is the episcotister/Talbot α (audit 6)', () => {
  it('a 50% black veil over white has linear luminance 0.5', () => {
    const { P } = computeForward(WHITE, BLACK, BLACK, 0.5);
    expect(Math.abs(getLuminance(P) - 0.5)).toBeLessThan(LUMINANCE_TOLERANCE);
  });

  it('the inverse reads α = 0.5 from a white/black display with a half-luminance overlap', () => {
    const inv = computeInverse(WHITE, BLACK, HALF_GREY, BLACK);
    expect(Math.abs(inv.alpha - 0.5)).toBeLessThan(ALPHA_TOLERANCE);
  });
});

describe('inverse mode reports what it finds (audit 7)', () => {
  it('warns that α is out of range when the overlaps have more contrast than the grounds', () => {
    const inv = computeInverse(
      { r: 130, g: 130, b: 130 },
      { r: 150, g: 150, b: 150 },
      { r: 20, g: 20, b: 20 },
      { r: 240, g: 240, b: 240 },
    );
    expect(inv.warnings.join(' ')).toContain('outside valid range');
  });

  it('flags channel α that disagree by more than Da Pos’s ±0.05', () => {
    // Over white/black with a black veil each channel's α is its linear value:
    // here 0.40, 0.50, 0.40 (sRGB 170, 188, 170). Their SD is under 0.05; the
    // spread from the mean is not.
    const P: RGB = { r: 170, g: 188, b: 170 };
    const inv = computeInverse(WHITE, BLACK, P, BLACK);
    expect(inv.warnings.join(' ')).toContain('Alpha inconsistency');
  });
});
