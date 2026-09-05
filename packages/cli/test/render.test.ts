import { describe, it, expect } from 'vitest';
import { run } from '../src/cli.js';

const ESC = '\u001b';
const A = '#3A6EA5';
const B = '#C8B560';

/** Captures stdout with ANSI colour left on, unlike the helper in cli.test.ts. */
function colored(...argv: string[]): string {
  const out: string[] = [];
  run(argv, { out: (s) => out.push(s), err: () => {}, color: true });
  return out.join('\n');
}

/** Captures stdout with colour off. */
function plain(...argv: string[]): string {
  const out: string[] = [];
  run(argv, { out: (s) => out.push(s), err: () => {}, color: false });
  return out.join('\n');
}

describe('rendering', () => {
  it('draws an ANSI chip of the colour itself when colour is on', () => {
    expect(colored('analyze', '#FF0000')).toContain(`${ESC}[48;2;255;0;0m`);
  });

  it('drops every escape sequence for --no-color', () => {
    expect(colored('analyze', '#FF0000', '--no-color')).not.toContain(ESC);
  });

  it('leaves JSON output free of escape sequences', () => {
    expect(colored('analyze', '#FF0000', '--json')).not.toContain(ESC);
  });

  it('chips every zone of a composed display', () => {
    const text = colored('compose', A, B, '#B0452A', '0.55');
    expect(text.split(`${ESC}[48;2;`).length - 1).toBeGreaterThanOrEqual(5);
  });
});

describe('suggest options', () => {
  it('scores candidates at the alpha it is given', () => {
    const data = JSON.parse(plain('suggest', A, B, '--alpha', '30%', '--json'));
    expect(data.alpha).toBeCloseTo(0.3, 10);
  });

  it('ranks candidates by quality, best first', () => {
    const { candidates } = JSON.parse(plain('suggest', A, B, '--json'));
    const qualities = candidates.map((c: { quality: number }) => c.quality);
    expect([...qualities].sort((x, y) => y - x)).toEqual(qualities);
  });
});
