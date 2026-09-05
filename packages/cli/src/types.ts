/** The contracts shared by `cli.ts` and every command. */

import type { FlagSpec, ParsedArgs } from './flags.js';

/** Where output goes. Injected so tests never touch the real streams. */
export interface CliIo {
  out(line: string): void;
  err(line: string): void;
  /** ANSI colour in the human-readable output. Defaults to true. */
  readonly color?: boolean;
}

export interface CommandContext {
  readonly color: boolean;
}

/**
 * A command computes both renderings and lets `cli.ts` choose: `text` for a
 * person, `json` for a script. Neither is printed by the command itself.
 */
export interface CommandResult {
  readonly json: Record<string, unknown>;
  readonly text: readonly string[];
  /** Defaults to 0. Set to `EXIT.invalid` when the analysis itself fails. */
  readonly exitCode?: number;
}

export interface Command {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  /** Extra lines shown under the usage line in `garau <command> --help`. */
  readonly details: readonly string[];
  readonly spec: FlagSpec;
  run(args: ParsedArgs, ctx: CommandContext): CommandResult;
}

export const NO_FLAGS: FlagSpec = { valueFlags: [], booleanFlags: [] };
