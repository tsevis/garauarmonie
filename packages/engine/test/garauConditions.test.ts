import { describe, it, expect } from 'vitest';
import { computeForward, validateTransparency, hexToRgb } from '../src/index.js';
import type { ValidationReport } from '../src/index.js';

// Tertiaries placed on the RYB disk (yR 40, rY 80, bY 160, yB 200, rB 280, bR 320).
const C = {
  R: '#C84650',
  Y: '#FFDC56',
  B: '#567F9A',
  G: '#84BB81',
  V: '#815E80', // a balanced violet whose nearest primary is blue
  grey: '#808080',
  yR: '#E97C48',
  rY: '#D78C00',
  bY: '#7BB145',
  yB: '#00B7A6',
  rB: '#B783E7',
  bR: '#E174AE',
} as const;
type Name = keyof typeof C;

/** Validate a hand-built display; the Garau conditions read only the colours. */
function report(A: Name, B: Name, P: Name, Q: Name, t: Name, alpha = 0.5): ValidationReport {
  const rgb = (n: Name) => hexToRgb(C[n]);
  return validateTransparency(rgb(A), rgb(B), rgb(P), rgb(Q), rgb(t), alpha);
}

describe('condition 4: the colour P and Q share is the veil colour', () => {
  it('red veil over yellow and blue: P = rY, Q = rB share red (pl. 35)', () => {
    expect(report('Y', 'B', 'rY', 'rB', 'R').veilIsCommonColor).toBe(true);
  });

  it('a red veil is not the colour bY and yB share, though they do share colours', () => {
    const r = report('bY', 'yB', 'bY', 'yB', 'R');
    expect(r.commonColorExists).toBe(true);
    expect(r.veilIsCommonColor).toBe(false);
  });
});

describe('condition 5: the divergent colours are the ground colours', () => {
  it('rY over yellow and rB over blue leave yellow and blue', () => {
    expect(report('Y', 'B', 'rY', 'rB', 'R').groundsAreDivergentColors).toBe(true);
  });

  it('rY over a red ground leaves a yellow that the ground does not hold', () => {
    expect(report('R', 'B', 'rY', 'rB', 'R').groundsAreDivergentColors).toBe(false);
  });
});

describe('condition 7: the ground assimilates the excess of an unbalanced common colour', () => {
  it.each([
    ['yR–rB over Y/B: nothing absorbs the excess red', 'Y', 'B', 'yR', 'rB', 'R', false],
    ['yR–rB over rY/B: the reddish-yellow ground absorbs it', 'rY', 'B', 'yR', 'rB', 'R', true],
    ['pl. 39: yR + bY over R and yB, yellow veil', 'R', 'yB', 'yR', 'bY', 'Y', true],
    ['pl. 37: yB + bY over G and Y, blue veil', 'G', 'Y', 'yB', 'bY', 'B', true],
    ['balanced (shared subordinate): not applicable', 'Y', 'B', 'rY', 'rB', 'R', null],
  ] as const)('%s', (_label, A, B, P, Q, t, expected) => {
    expect(report(A, B, P, Q, t).groundAssimilatesExcess).toBe(expected);
  });
});

describe('conditions 9–10: designing the veil from the ground', () => {
  it.each([
    ['Y and B ground ask for a red veil', 'Y', 'B', 'R', true],
    ['Y and B ground do not take a yellow veil', 'Y', 'B', 'Y', false],
    ['yB and yR ground ask for more yellow', 'yB', 'yR', 'Y', true],
    ['yB and yR ground do not take a red veil', 'yB', 'yR', 'R', false],
    ['G and Y ground: the book gives no rule', 'G', 'Y', 'B', null],
  ] as const)('%s', (_label, A, B, t, expected) => {
    expect(report(A, B, 'rY', 'rB', t).veilFromGround).toBe(expected);
  });
});

describe('a grey overlap has no colour to share or split', () => {
  it('grey P beside red Q has no common colour (the old 45° rule passed it)', () => {
    expect(report('Y', 'B', 'grey', 'R', 'R').commonColorExists).toBe(false);
  });

  it('grey P is not a visual mixture', () => {
    expect(report('Y', 'B', 'grey', 'rB', 'R').visualMixtureP).toBe(false);
  });
});

describe('condition 8 and balance replace the single quality score (audit 8)', () => {
  it('a red veil subordinate in both overlaps is very transparent', () => {
    expect(report('Y', 'B', 'rY', 'rB', 'R').degreeOfTransparency).toBe('Very transparent');
  });

  it('a veil colour balanced in one overlap (violet BR) is neither: intermediate', () => {
    expect(report('B', 'Y', 'V', 'rY', 'R').degreeOfTransparency).toBe('Intermediate');
  });

  it('a red veil dominant in both overlaps is nearly opaque', () => {
    expect(report('Y', 'B', 'yR', 'bR', 'R').degreeOfTransparency).toBe('Nearly opaque');
  });

  it('the report has a balance readout and no blended quality score', () => {
    const r = report('Y', 'B', 'yR', 'rB', 'R');
    expect(r.balance?.balanced).toBe(false);
    expect('transparencyQuality' in r).toBe(false);
  });
});

describe('conditions 4 and 5 are necessary for a valid transparency', () => {
  const forward = (A: Name, B: Name, t: Name, alpha: number): ValidationReport => {
    const rgb = (n: Name) => hexToRgb(C[n]);
    const f = computeForward(rgb(A), rgb(B), rgb(t), alpha);
    return validateTransparency(rgb(A), rgb(B), f.P, f.Q, rgb(t), alpha);
  };

  it('a reddish-blue veil over red and yellow: P and Q share red, not the veil’s blue', () => {
    const r = forward('R', 'Y', 'rB', 0.5);
    expect(r.veilIsCommonColor).toBe(false);
    expect(r.overallValid).toBe(false);
  });

  it('a red veil over red and yellow: over red nothing is left for the ground', () => {
    const r = forward('R', 'Y', 'R', 0.6);
    expect(r.groundsAreDivergentColors).toBe(false);
    expect(r.overallValid).toBe(false);
  });
});
