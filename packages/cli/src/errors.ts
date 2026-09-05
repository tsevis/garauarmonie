/**
 * The one error type the CLI raises on its own behalf. Anything thrown as a
 * `CliError` is a message meant for the user, not a stack trace: `cli.ts`
 * prints `message` to stderr and exits with `exitCode`.
 */

/** Exit codes, in the usual shell convention. */
export const EXIT = {
  /** Everything worked. */
  ok: 0,
  /** The command ran, but the configuration is not a valid transparency. */
  invalid: 1,
  /** Bad arguments — the user needs to change the command line. */
  usage: 2,
  /** A bug in the CLI or the engine. */
  internal: 70,
} as const;

export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number = EXIT.usage) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}
