/**
 * A very small option parser. Each command declares the flags it understands,
 * so an unknown or misused flag is a usage error rather than a silently
 * ignored argument.
 */

import { CliError } from './errors.js';

export interface FlagSpec {
  /** Flags that take a value: `--range 0.2,0.8` or `--range=0.2,0.8`. */
  readonly valueFlags: readonly string[];
  /** Flags that are present or absent: `--json`. */
  readonly booleanFlags: readonly string[];
  /** Single-letter shorthands, e.g. `{ s: 'samples' }`. */
  readonly aliases?: Readonly<Record<string, string>>;
}

export interface ParsedArgs {
  readonly positionals: readonly string[];
  readonly flags: Readonly<Record<string, string | true>>;
}

/** Merges two specs into a new one; neither input is modified. */
export function mergeSpecs(a: FlagSpec, b: FlagSpec): FlagSpec {
  return {
    valueFlags: [...a.valueFlags, ...b.valueFlags],
    booleanFlags: [...a.booleanFlags, ...b.booleanFlags],
    aliases: { ...a.aliases, ...b.aliases },
  };
}

const isNegativeNumber = (token: string): boolean => /^-[.\d]/.test(token);

/** Splits `argv` into positionals and flags. The input array is never mutated. */
export function parseArgs(argv: readonly string[], spec: FlagSpec): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};
  let literal = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!;

    if (literal || token === '' || !token.startsWith('-') || isNegativeNumber(token)) {
      positionals.push(token);
      continue;
    }
    if (token === '--') {
      literal = true;
      continue;
    }

    const body = token.startsWith('--') ? token.slice(2) : token.slice(1);
    const eq = body.indexOf('=');
    const rawName = eq === -1 ? body : body.slice(0, eq);
    const inlineValue = eq === -1 ? null : body.slice(eq + 1);
    const name = spec.aliases?.[rawName] ?? rawName;

    if (spec.booleanFlags.includes(name)) {
      if (inlineValue !== null) throw new CliError(`Flag --${name} does not take a value.`);
      flags[name] = true;
      continue;
    }
    if (spec.valueFlags.includes(name)) {
      const value = inlineValue ?? argv[i + 1];
      if (value === undefined || (inlineValue === null && value.startsWith('-') && !isNegativeNumber(value))) {
        throw new CliError(`Flag --${name} needs a value.`);
      }
      if (inlineValue === null) i += 1;
      flags[name] = value;
      continue;
    }
    throw new CliError(`Unknown flag: ${token}`);
  }

  return { positionals, flags };
}

/** Enforces the positional arity of a command. */
export function expectPositionals(
  args: ParsedArgs,
  usage: string,
  min: number,
  max: number = min,
): readonly string[] {
  const { positionals } = args;
  if (positionals.length < min || positionals.length > max) {
    const wanted = min === max ? `${min}` : `${min}–${max}`;
    throw new CliError(
      `Expected ${wanted} argument${max === 1 ? '' : 's'}, got ${positionals.length}.\n  Usage: ${usage}`,
    );
  }
  return positionals;
}
