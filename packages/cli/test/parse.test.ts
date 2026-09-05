import { describe, it, expect } from 'vitest';
import { parseColor, parseAlpha, parseRange, parseCount } from '../src/parse.js';
import { CliError } from '../src/errors.js';

describe('parseColor', () => {
  it('accepts six-digit hex with or without a hash, in any case', () => {
    expect(parseColor('#A1B2C3', 'A')).toEqual({ r: 161, g: 178, b: 195 });
    expect(parseColor('a1b2c3', 'A')).toEqual({ r: 161, g: 178, b: 195 });
  });

  it('expands three-digit hex', () => {
    expect(parseColor('#f80', 'A')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('accepts comma triples, bare or in rgb() form, with loose spacing', () => {
    expect(parseColor('12, 34,56', 'A')).toEqual({ r: 12, g: 34, b: 56 });
    expect(parseColor('rgb(12 34 56)', 'A')).toEqual({ r: 12, g: 34, b: 56 });
  });

  it('names the offending argument when the value is not a colour', () => {
    expect(() => parseColor('zzz', 'B')).toThrow(CliError);
    expect(() => parseColor('zzz', 'B')).toThrow(/B/);
  });

  it('rejects out-of-range and non-integer channels rather than clamping', () => {
    expect(() => parseColor('12,34,300', 'A')).toThrow(CliError);
    expect(() => parseColor('12,34,-1', 'A')).toThrow(CliError);
    expect(() => parseColor('12,34,5.5', 'A')).toThrow(CliError);
  });

  it('rejects an empty or partial value', () => {
    expect(() => parseColor('', 'A')).toThrow(CliError);
    expect(() => parseColor('#ab', 'A')).toThrow(CliError);
    expect(() => parseColor('12,34', 'A')).toThrow(CliError);
  });
});

describe('parseAlpha', () => {
  it('accepts a 0–1 fraction and a percentage', () => {
    expect(parseAlpha('0.35', 'alpha')).toBeCloseTo(0.35, 10);
    expect(parseAlpha('35%', 'alpha')).toBeCloseTo(0.35, 10);
    expect(parseAlpha('0', 'alpha')).toBe(0);
    expect(parseAlpha('1', 'alpha')).toBe(1);
  });

  it('rejects values outside [0, 1] and non-numbers', () => {
    expect(() => parseAlpha('1.2', 'alpha')).toThrow(CliError);
    expect(() => parseAlpha('-0.1', 'alpha')).toThrow(CliError);
    expect(() => parseAlpha('half', 'alpha')).toThrow(CliError);
  });
});

describe('parseRange', () => {
  it('reads "min,max" as an ordered alpha pair', () => {
    expect(parseRange('0.2,0.8', '--range')).toEqual([0.2, 0.8]);
  });

  it('rejects a reversed, malformed or out-of-range pair', () => {
    expect(() => parseRange('0.8,0.2', '--range')).toThrow(CliError);
    expect(() => parseRange('0.2', '--range')).toThrow(CliError);
    expect(() => parseRange('0.2,1.5', '--range')).toThrow(CliError);
  });
});

describe('parseCount', () => {
  it('accepts a positive integer within bounds', () => {
    expect(parseCount('7', '--samples', 2, 50)).toBe(7);
  });

  it('rejects non-integers and out-of-bounds values', () => {
    expect(() => parseCount('7.5', '--samples', 2, 50)).toThrow(CliError);
    expect(() => parseCount('1', '--samples', 2, 50)).toThrow(CliError);
    expect(() => parseCount('99', '--samples', 2, 50)).toThrow(CliError);
  });
});
