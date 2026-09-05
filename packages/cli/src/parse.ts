/**
 * Argument parsing for colours and numbers — the CLI's boundary with the
 * outside world. Everything is validated here and fails fast with a message
 * naming the offending argument, so no malformed value ever reaches the
 * engine (which clamps silently rather than complaining).
 */

import type { RGB } from '@garau/engine';
import { rgb, hexToRgb } from '@garau/engine';
import { CliError } from './errors.js';

const HEX = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_CALL = /^rgb\(([^)]*)\)$/i;

/** The colour forms the CLI accepts, quoted in every parse error. */
export const COLOR_SYNTAX = '#RRGGBB, #RGB, "r,g,b" or "rgb(r, g, b)"';

const colorError = (input: string, label: string, why: string): CliError =>
  new CliError(`Invalid color for ${label}: ${JSON.stringify(input)} — ${why}. Expected ${COLOR_SYNTAX}.`);

/** Reads "12,34,56" or "rgb(12 34 56)"; returns null if it is not a triple at all. */
function readTriple(raw: string, input: string, label: string): RGB | null {
  const call = RGB_CALL.exec(raw);
  const body = call?.[1] ?? raw;
  const parts = body.split(/[\s,]+/).filter((p) => p !== '');
  if (parts.length !== 3) return null;

  const channels = parts.map(Number);
  for (const value of channels) {
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw colorError(input, label, 'channels must be whole numbers from 0 to 255');
    }
  }
  return rgb(channels[0]!, channels[1]!, channels[2]!);
}

/** Parses a colour argument into an immutable RGB triple. */
export function parseColor(input: string, label: string): RGB {
  const raw = input.trim();
  if (raw === '') throw colorError(input, label, 'the value is empty');
  if (HEX.test(raw)) return hexToRgb(raw);

  const triple = readTriple(raw, input, label);
  if (triple !== null) return triple;
  throw colorError(input, label, 'unrecognized color syntax');
}

/** Parses a transparency coefficient: `0.55` or `55%`, always within [0, 1]. */
export function parseAlpha(input: string, label: string): number {
  const raw = input.trim();
  if (raw === '') throw new CliError(`Invalid ${label}: the value is empty. Expected 0–1 or a percentage.`);

  const isPercent = raw.endsWith('%');
  const magnitude = Number(isPercent ? raw.slice(0, -1) : raw);
  if (!Number.isFinite(magnitude)) {
    throw new CliError(`Invalid ${label}: ${JSON.stringify(input)} is not a number. Expected 0–1 or a percentage.`);
  }

  const value = isPercent ? magnitude / 100 : magnitude;
  if (value < 0 || value > 1) {
    throw new CliError(`Invalid ${label}: ${JSON.stringify(input)} is outside the range 0–1.`);
  }
  return value;
}

/** Parses `--range min,max` into an ordered pair of alphas. */
export function parseRange(input: string, label: string): readonly [number, number] {
  const parts = input.split(',').map((p) => p.trim());
  if (parts.length !== 2) {
    throw new CliError(`Invalid ${label}: ${JSON.stringify(input)}. Expected "min,max", e.g. 0.2,0.8.`);
  }
  const min = parseAlpha(parts[0]!, label);
  const max = parseAlpha(parts[1]!, label);
  if (min >= max) {
    throw new CliError(`Invalid ${label}: ${JSON.stringify(input)}. The minimum must be below the maximum.`);
  }
  return [min, max];
}

/** Parses a bounded, whole-number option such as `--samples`. */
export function parseCount(input: string, label: string, min: number, max: number): number {
  const value = Number(input.trim());
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new CliError(`Invalid ${label}: ${JSON.stringify(input)}. Expected a whole number from ${min} to ${max}.`);
  }
  return value;
}
