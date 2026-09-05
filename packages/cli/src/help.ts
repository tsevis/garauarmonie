/** The help text, generated from the command registry so it cannot drift. */

import { COMMANDS } from './commands/index.js';
import { COLOR_SYNTAX } from './parse.js';
import { dim } from './format.js';
import type { Command } from './types.js';
import { VERSION } from './version.js';

const GLOBAL_OPTIONS: readonly string[] = [
  '  --json         Machine-readable JSON instead of the formatted reading',
  '  --no-color     Plain text with no ANSI colour',
  '  -h, --help     Show this help, or a command’s own help',
  '  -V, --version  Print the version',
];

const nameColumn = (): number => Math.max(...COMMANDS.map((c) => c.name.length)) + 2;

export function topLevelHelp(color: boolean): readonly string[] {
  const width = nameColumn();
  return [
    `garau ${VERSION} — Augusto Garau’s colour theory and Metelli’s transparency, from the shell.`,
    '',
    dim('Usage', color),
    '  garau <command> [arguments] [options]',
    '',
    dim('Commands', color),
    ...COMMANDS.map((c) => `  ${c.name.padEnd(width)}${c.summary}`),
    '',
    dim('Arguments', color),
    `  Colours   ${COLOR_SYNTAX}`,
    '  alpha     0 (fully transparent) to 1 (opaque), or a percentage such as 55%',
    '',
    dim('Options', color),
    ...GLOBAL_OPTIONS,
    '',
    dim('Exit codes', color),
    '  0  the command ran',
    '  1  the display is not a valid transparency',
    '  2  the arguments were wrong',
    '',
    dim('Examples', color),
    '  garau compose "#3A6EA5" "#C8B560" "#B0452A" 0.55',
    '  garau inverse "#3A6EA5" "#C8B560" "#6F5C6E" "#BD8348" --json',
    '  garau analyze "#B0452A" "#3A6EA5"',
    '',
    dim('In memory of Professor Augusto Garau (1923–2010).', color),
  ];
}

export function commandHelp(command: Command, color: boolean): readonly string[] {
  return [
    dim('Usage', color),
    `  ${command.usage}`,
    '',
    `  ${command.summary}`,
    ...(command.details.length === 0 ? [] : ['', ...command.details.map((d) => `  ${d}`)]),
    '',
    dim('Options', color),
    ...GLOBAL_OPTIONS,
  ];
}
