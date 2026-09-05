/**
 * `garau inverse` — inverse Metelli: recover the veil colour t and the
 * transparency alpha from an existing four-zone display.
 */

import { computeInverse, validateTransparency } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseAlpha, parseColor } from '../parse.js';
import { bullets, colorInfo, heading, kv, percent, swatchWithNotation } from '../format.js';
import { exitFor, reportLines } from '../report.js';
import type { Command } from '../types.js';

const USAGE = 'garau inverse <A> <B> <P> <Q>';
const DEFAULT_TOLERANCE = 0.1;

export const inverseCommand: Command = {
  name: 'inverse',
  summary: 'Inverse mode: recover t and alpha from A, B and the overlaps P, Q.',
  usage: USAGE,
  details: [
    'alpha is averaged across the three channels; --tolerance sets how far',
    'the per-channel estimates may diverge before the scission is rejected',
    `(default ${DEFAULT_TOLERANCE}).`,
    'Exits 1 when the recovered scission is not a valid transparency.',
  ],
  spec: { valueFlags: ['tolerance'], booleanFlags: [] },
  run(args, ctx) {
    const [aArg, bArg, pArg, qArg] = expectPositionals(args, USAGE, 4);
    const A = parseColor(aArg!, 'A');
    const B = parseColor(bArg!, 'B');
    const P = parseColor(pArg!, 'P');
    const Q = parseColor(qArg!, 'Q');

    const toleranceArg = args.flags['tolerance'];
    const tolerance =
      typeof toleranceArg === 'string' ? parseAlpha(toleranceArg, '--tolerance') : DEFAULT_TOLERANCE;

    const recovered = computeInverse(A, B, P, Q, tolerance);
    const report = validateTransparency(A, B, P, Q, recovered.t, recovered.alpha);

    return {
      json: {
        A: colorInfo(A),
        B: colorInfo(B),
        P: colorInfo(P),
        Q: colorInfo(Q),
        t: colorInfo(recovered.t),
        alpha: recovered.alpha,
        tolerance,
        inverseWarnings: recovered.warnings,
        validation: report,
      },
      text: [
        heading('Given', ctx.color),
        swatchWithNotation('A', A, ctx.color),
        swatchWithNotation('B', B, ctx.color),
        swatchWithNotation('P', P, ctx.color),
        swatchWithNotation('Q', Q, ctx.color),
        heading('Recovered', ctx.color),
        swatchWithNotation('t', recovered.t, ctx.color),
        kv('alpha', `${recovered.alpha.toFixed(4)}  (${percent(recovered.alpha)})`),
        ...(recovered.warnings.length === 0
          ? []
          : [heading('Recovery warnings', ctx.color), ...bullets(recovered.warnings)]),
        ...reportLines(report, ctx.color),
      ],
      exitCode: exitFor(report),
    };
  },
};
