/**
 * `garau validate` — the full condition-by-condition report for a four-zone
 * display whose veil and alpha are already known.
 */

import { validateTransparency } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseAlpha, parseColor } from '../parse.js';
import { colorInfo, heading, percent, swatch, swatchWithNotation } from '../format.js';
import { exitFor, reportLines } from '../report.js';
import type { Command } from '../types.js';
import { NO_FLAGS } from '../types.js';

const USAGE = 'garau validate <A> <B> <P> <Q> <t> <alpha>';

export const validateCommand: Command = {
  name: 'validate',
  summary: 'Check a complete display against Metelli’s and Garau’s conditions.',
  usage: USAGE,
  details: [
    'Unlike compose and inverse, nothing is computed: every zone is given, so',
    'the report answers only whether the display reads as a transparency.',
    'Exits 1 when it does not.',
  ],
  spec: NO_FLAGS,
  run(args, ctx) {
    const [aArg, bArg, pArg, qArg, tArg, alphaArg] = expectPositionals(args, USAGE, 6);
    const A = parseColor(aArg!, 'A');
    const B = parseColor(bArg!, 'B');
    const P = parseColor(pArg!, 'P');
    const Q = parseColor(qArg!, 'Q');
    const t = parseColor(tArg!, 't');
    const alpha = parseAlpha(alphaArg!, 'alpha');

    const report = validateTransparency(A, B, P, Q, t, alpha);

    return {
      json: {
        A: colorInfo(A),
        B: colorInfo(B),
        P: colorInfo(P),
        Q: colorInfo(Q),
        t: colorInfo(t),
        alpha,
        report,
      },
      text: [
        heading('Display', ctx.color),
        swatchWithNotation('A', A, ctx.color),
        swatchWithNotation('B', B, ctx.color),
        swatchWithNotation('P', P, ctx.color),
        swatchWithNotation('Q', Q, ctx.color),
        swatch('t', t, ctx.color, `alpha ${percent(alpha)}`),
        ...reportLines(report, ctx.color, { conditions: true }),
      ],
      exitCode: exitFor(report),
    };
  },
};
