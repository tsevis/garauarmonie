/** The command registry — the single list `cli.ts` and the help text read. */

import type { Command } from '../types.js';
import { analyzeCommand } from './analyze.js';
import { composeCommand } from './compose.js';
import { convertCommand } from './convert.js';
import { designerCommand } from './designer.js';
import { inverseCommand } from './inverse.js';
import { suggestCommand } from './suggest.js';
import { validateCommand } from './validate.js';

/** Ordered as the help lists them: transparency first, then colour reading. */
export const COMMANDS: readonly Command[] = [
  composeCommand,
  inverseCommand,
  designerCommand,
  validateCommand,
  suggestCommand,
  analyzeCommand,
  convertCommand,
];

export const findCommand = (name: string): Command | undefined =>
  COMMANDS.find((c) => c.name === name);
