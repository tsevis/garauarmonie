/**
 * The CLI's version, read from its own package.json so the two cannot drift.
 * `src/` and `dist/` sit at the same depth, so one `..` works either way.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function readVersion(): string {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const manifest: unknown = JSON.parse(readFileSync(path.join(here, '..', 'package.json'), 'utf8'));
    const version = (manifest as { version?: unknown }).version;
    return typeof version === 'string' ? version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const VERSION = readVersion();
