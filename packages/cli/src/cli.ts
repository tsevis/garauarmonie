/**
 * The entry point: dispatch a command, choose a rendering, map errors onto
 * exit codes. Nothing here knows any colour theory.
 */

import { CliError, EXIT } from './errors.js';
import { COMMANDS, findCommand } from './commands/index.js';
import { mergeSpecs, parseArgs } from './flags.js';
import { commandHelp, topLevelHelp } from './help.js';
import type { CliIo, Command } from './types.js';
import { VERSION } from './version.js';

/** Flags every command understands, on top of its own. */
const GLOBAL_SPEC = {
  valueFlags: [] as readonly string[],
  booleanFlags: ['json', 'no-color', 'help'] as readonly string[],
  aliases: { h: 'help' },
};

const HELP_TOKENS = new Set(['--help', '-h']);
const VERSION_TOKENS = new Set(['--version', '-V']);

const emit = (lines: readonly string[], write: (line: string) => void): void => {
  lines.forEach(write);
};

function suggestion(name: string): string {
  const near = COMMANDS.map((c) => c.name).filter(
    (c) => c.startsWith(name.slice(0, 2)) || name.startsWith(c.slice(0, 2)),
  );
  const hint = near.length > 0 ? ` Did you mean: ${near.join(', ')}?` : '';
  return `Unknown command: ${name}.${hint} Run "garau --help" for the list.`;
}

function runCommand(command: Command, argv: readonly string[], io: CliIo, defaultColor: boolean): number {
  const args = parseArgs(argv, mergeSpecs(GLOBAL_SPEC, command.spec));
  const color = defaultColor && args.flags['no-color'] !== true;

  if (args.flags['help'] === true) {
    emit(commandHelp(command, color), io.out);
    return EXIT.ok;
  }

  const result = command.run(args, { color });
  if (args.flags['json'] === true) io.out(JSON.stringify(result.json, null, 2));
  else emit(result.text, io.out);
  return result.exitCode ?? EXIT.ok;
}

/**
 * Runs one invocation. `argv` excludes the node binary and script path.
 * Returns the process exit code; never throws.
 */
export function run(argv: readonly string[], io: CliIo): number {
  const color = io.color ?? true;
  const [head, ...rest] = argv;

  try {
    if (head === undefined || HELP_TOKENS.has(head)) {
      emit(topLevelHelp(color && !argv.includes('--no-color')), io.out);
      return EXIT.ok;
    }
    if (VERSION_TOKENS.has(head)) {
      io.out(VERSION);
      return EXIT.ok;
    }
    if (head.startsWith('-')) throw new CliError(`Unknown option: ${head}. Run "garau --help".`);

    const command = findCommand(head);
    if (command === undefined) throw new CliError(suggestion(head));

    return runCommand(command, rest, io, color);
  } catch (error: unknown) {
    if (error instanceof CliError) {
      io.err(error.message);
      return error.exitCode;
    }
    io.err(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT.internal;
  }
}
