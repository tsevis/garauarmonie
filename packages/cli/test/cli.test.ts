import { describe, it, expect } from 'vitest';
import { run } from '../src/cli.js';

interface Capture {
  readonly code: number;
  readonly out: string;
  readonly err: string;
}

/** Runs the CLI with colour disabled and captures both streams. */
function cli(...argv: string[]): Capture {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(argv, { out: (s) => out.push(s), err: (s) => err.push(s), color: false });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

const A = '#3A6EA5';
const B = '#C8B560';
const T = '#B0452A';
const P = '#6F5C6E';
const Q = '#BD8348';

describe('top level', () => {
  it('prints help listing every command when given no arguments', () => {
    const r = cli();
    expect(r.code).toBe(0);
    for (const name of ['analyze', 'compose', 'inverse', 'designer', 'validate', 'suggest', 'convert']) {
      expect(r.out).toContain(name);
    }
  });

  it('prints the same help for --help and -h', () => {
    expect(cli('--help').out).toBe(cli('-h').out);
  });

  it('prints a version for --version', () => {
    const r = cli('--version');
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/\d+\.\d+\.\d+/);
  });

  it('reports an unknown command on stderr with exit code 2', () => {
    const r = cli('bogus');
    expect(r.code).toBe(2);
    expect(r.err).toContain('bogus');
    expect(r.out).toBe('');
  });

  it('prints per-command help without running the command', () => {
    const r = cli('compose', '--help');
    expect(r.code).toBe(0);
    expect(r.out).toContain('garau compose');
    expect(r.out).not.toContain('#6F5C6E');
  });
});

describe('analyze', () => {
  it('decomposes a single colour into its Garau notation', () => {
    const r = cli('analyze', '#FF0000');
    expect(r.code).toBe(0);
    expect(r.out).toContain('#FF0000');
    expect(r.out).toMatch(/notation/i);
  });

  it('emits the mixture as JSON', () => {
    const r = cli('analyze', '#FF0000', '--json');
    const data = JSON.parse(r.out);
    expect(data.mixture.dominant).toBe('R');
    expect(data.mixture.notation).toBe('R');
    expect(data.pair).toBeUndefined();
  });

  it('classifies a pair when given two colours', () => {
    const r = cli('analyze', '#FF0000', '#0000FF', '--json');
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.pair.type).toBe('Partial Inversion');
    expect(data.pair.harmony).toBe('Neutral');
  });

  it('rejects a third colour', () => {
    expect(cli('analyze', '#FF0000', '#00FF00', '#0000FF').code).toBe(2);
  });

  it('rejects a malformed colour, naming the argument', () => {
    const r = cli('analyze', 'nonsense');
    expect(r.code).toBe(2);
    expect(r.err).toContain('color');
  });
});

describe('compose', () => {
  it('computes the two overlap zones from A, B, t and alpha', () => {
    const r = cli('compose', A, B, T, '0.55', '--json');
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.P.hex).toBe(P);
    expect(data.Q.hex).toBe(Q);
    expect(data.validation.overallValid).toBe(true);
  });

  it('renders the zones and a validity summary as text', () => {
    const r = cli('compose', A, B, T, '0.55');
    expect(r.out).toContain(P);
    expect(r.out).toContain(Q);
    expect(r.out).toMatch(/quality/i);
  });

  it('accepts alpha as a percentage', () => {
    const asPercent = cli('compose', A, B, T, '55%', '--json');
    expect(JSON.parse(asPercent.out).P.hex).toBe(P);
  });

  it('exits 1 when the configuration is not a valid transparency', () => {
    const r = cli('compose', A, A, T, '0.5');
    expect(r.code).toBe(1);
    expect(JSON.parse(cli('compose', A, A, T, '0.5', '--json').out).validation.overallValid).toBe(false);
  });

  it('rejects the wrong number of arguments', () => {
    expect(cli('compose', A, B, T).code).toBe(2);
    expect(cli('compose', A, B, T, '0.5', '#000').code).toBe(2);
  });
});

describe('inverse', () => {
  it('recovers t and alpha from a four-zone display', () => {
    const r = cli('inverse', A, B, P, Q, '--json');
    const data = JSON.parse(r.out);
    expect(data.alpha).toBeCloseTo(0.55, 2);
    expect(data.t.hex).toBe('#B0462B');
  });

  it('honours --tolerance', () => {
    expect(cli('inverse', A, B, P, Q, '--tolerance', '0.5').code).toBeLessThan(2);
    expect(cli('inverse', A, B, P, Q, '--tolerance', 'wide').code).toBe(2);
  });
});

describe('designer', () => {
  it('sweeps alpha and returns one result per sample', () => {
    const r = cli('designer', A, B, T, '--samples', '3', '--range', '0.2,0.8', '--json');
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.samples).toHaveLength(3);
    expect(data.samples[0].alpha).toBeCloseTo(0.2, 6);
    expect(data.samples[2].alpha).toBeCloseTo(0.8, 6);
  });

  it('prints one row per sample as text', () => {
    const r = cli('designer', A, B, T, '--samples', '3');
    expect(r.out.split('\n').filter((l) => l.includes('%')).length).toBeGreaterThanOrEqual(3);
  });
});

describe('validate', () => {
  it('reports every condition for a full six-argument configuration', () => {
    const r = cli('validate', A, B, P, Q, T, '0.55', '--json');
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.report.overallValid).toBe(true);
    expect(data.report.juxtapositionType).toBeTruthy();
  });

  it('lists the named conditions in the text report', () => {
    const r = cli('validate', A, B, P, Q, T, '0.55');
    expect(r.out).toMatch(/contrast reduction/i);
    expect(r.out).toMatch(/scission/i);
  });
});

describe('suggest', () => {
  it('proposes veil colours for a pair of backgrounds', () => {
    const r = cli('suggest', A, B, '--json');
    expect(r.code).toBe(0);
    const data = JSON.parse(r.out);
    expect(data.candidates.length).toBeGreaterThanOrEqual(6);
    expect(data.candidates[0].hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(typeof data.candidates[0].label).toBe('string');
    expect(typeof data.candidates[0].quality).toBe('number');
  });
});

describe('convert', () => {
  it('prints every space the engine can express', () => {
    const r = cli('convert', '#FF0000', '--json');
    const data = JSON.parse(r.out);
    expect(data.colors[0].hex).toBe('#FF0000');
    expect(data.colors[0].hsl.h).toBeCloseTo(0, 6);
    expect(data.colors[0].oklch.L).toBeGreaterThan(0);
    expect(data.colors[0].luminance).toBeGreaterThan(0);
    expect(data.contrast).toBeUndefined();
  });

  it('adds the WCAG contrast ratio for two colours', () => {
    const data = JSON.parse(cli('convert', '#FFFFFF', '#000000', '--json').out);
    expect(data.contrast).toBeCloseTo(21, 1);
  });
});
