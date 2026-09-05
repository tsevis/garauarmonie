/** Programmatic entry point, for embedding the CLI in another process. */

export { run } from './cli.js';
export { CliError, EXIT } from './errors.js';
export type { CliIo, CommandResult } from './types.js';
export { VERSION } from './version.js';
