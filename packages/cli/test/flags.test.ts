import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/flags.js';
import { CliError } from '../src/errors.js';

const SPEC = { valueFlags: ['range', 'samples'], booleanFlags: ['json'], aliases: { s: 'samples' } };

describe('parseArgs', () => {
  it('separates positionals from flags', () => {
    const parsed = parseArgs(['#fff', '#000', '--json'], SPEC);
    expect(parsed.positionals).toEqual(['#fff', '#000']);
    expect(parsed.flags['json']).toBe(true);
  });

  it('reads a value flag in both --key=value and --key value forms', () => {
    expect(parseArgs(['--range=0.2,0.8'], SPEC).flags['range']).toBe('0.2,0.8');
    expect(parseArgs(['--range', '0.2,0.8'], SPEC).flags['range']).toBe('0.2,0.8');
  });

  it('resolves single-letter aliases', () => {
    expect(parseArgs(['-s', '5'], SPEC).flags['samples']).toBe('5');
  });

  it('rejects an unknown flag', () => {
    expect(() => parseArgs(['--nope'], SPEC)).toThrow(CliError);
  });

  it('rejects a value flag with nothing after it', () => {
    expect(() => parseArgs(['--range'], SPEC)).toThrow(CliError);
  });

  it('rejects a value given to a boolean flag', () => {
    expect(() => parseArgs(['--json=1'], SPEC)).toThrow(CliError);
  });

  it('treats everything after -- as positional', () => {
    expect(parseArgs(['--', '--json'], SPEC).positionals).toEqual(['--json']);
  });

  it('does not mutate the argv it is given', () => {
    const argv = ['--range', '0.2,0.8', '#fff'];
    const before = [...argv];
    parseArgs(argv, SPEC);
    expect(argv).toEqual(before);
  });
});
