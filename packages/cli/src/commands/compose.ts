/**
 * `garau compose` — forward Metelli: two backgrounds, a veil and its
 * transparency give the two overlap zones.
 */

import { computeForward, validateTransparency } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseAlpha, parseColor } from '../parse.js';
import { bullets, colorInfo, heading, percent, swatch, swatchWithNotation } from '../format.js';
import { exitFor, reportLines } from '../report.js';
import type { Command } from '../types.js';
import { NO_FLAGS } from '../types.js';

const USAGE = 'garau compose <A> <B> <t> <alpha>';

export const composeCommand: Command = {
  name: 'compose',
  summary: 'Forward mode: compute overlaps P and Q from A, B, t and alpha.',
  usage: USAGE,
  details: [
    'P = alpha*A + (1-alpha)*t and Q = alpha*B + (1-alpha)*t, per channel.',
    'alpha is 0 (fully transparent) to 1 (opaque); "55%" is accepted too.',
    'Exits 1 when the resulting four-zone display is not a valid transparency.',
  ],
  spec: NO_FLAGS,
  run(args, ctx) {
    const [aArg, bArg, tArg, alphaArg] = expectPositionals(args, USAGE, 4);
    const A = parseColor(aArg!, 'A');
    const B = parseColor(bArg!, 'B');
    const t = parseColor(tArg!, 't');
    const alpha = parseAlpha(alphaArg!, 'alpha');

    const forward = computeForward(A, B, t, alpha);
    const report = validateTransparency(A, B, forward.P, forward.Q, t, alpha);

    return {
      json: {
        A: colorInfo(A),
        B: colorInfo(B),
        t: colorInfo(t),
        alpha,
        P: colorInfo(forward.P),
        Q: colorInfo(forward.Q),
        forwardWarnings: forward.warnings,
        validation: report,
      },
      text: [
        heading('Display', ctx.color),
        swatchWithNotation('A', A, ctx.color),
        swatchWithNotation('B', B, ctx.color),
        swatch('t', t, ctx.color, `alpha ${percent(alpha)}`),
        swatchWithNotation('P', forward.P, ctx.color),
        swatchWithNotation('Q', forward.Q, ctx.color),
        ...(forward.warnings.length === 0
          ? []
          : [heading('Forward warnings', ctx.color), ...bullets(forward.warnings)]),
        ...reportLines(report, ctx.color),
      ],
      exitCode: exitFor(report),
    };
  },
};
