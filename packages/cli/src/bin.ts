#!/usr/bin/env node
/** The `garau` executable: wires `run` to the real streams and exit code. */

import { run } from './cli.js';

const isTty = process.stdout.isTTY === true;
const color = isTty && process.env['NO_COLOR'] === undefined && process.env['TERM'] !== 'dumb';

process.exitCode = run(process.argv.slice(2), {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  color,
});
