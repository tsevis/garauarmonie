/**
 * `garau designer` — sweep alpha across a range and read the whole family of
 * displays at once, so the most convincing transparency can be picked by eye.
 */

import { computeDesigner, validateTransparency } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseColor, parseCount, parseRange } from '../parse.js';
import { chip, colorInfo, heading, percent, score, swatchWithNotation } from '../format.js';
import type { Command } from '../types.js';

const USAGE = 'garau designer <A> <B> <t>';
const DEFAULT_RANGE: readonly [number, number] = [0.2, 0.8];
const DEFAULT_SAMPLES = 7;
const MIN_SAMPLES = 2;
const MAX_SAMPLES = 50;

export const designerCommand: Command = {
  name: 'designer',
  summary: 'Sweep alpha over a range and report the display at each step.',
  usage: USAGE,
  details: [
    `--range min,max    alpha range to sample (default ${DEFAULT_RANGE[0]},${DEFAULT_RANGE[1]})`,
    `--samples n, -s n  number of steps, ${MIN_SAMPLES}-${MAX_SAMPLES} (default ${DEFAULT_SAMPLES})`,
  ],
  spec: { valueFlags: ['range', 'samples'], booleanFlags: [], aliases: { s: 'samples' } },
  run(args, ctx) {
    const [aArg, bArg, tArg] = expectPositionals(args, USAGE, 3);
    const A = parseColor(aArg!, 'A');
    const B = parseColor(bArg!, 'B');
    const t = parseColor(tArg!, 't');

    const rangeArg = args.flags['range'];
    const range = typeof rangeArg === 'string' ? parseRange(rangeArg, '--range') : DEFAULT_RANGE;
    const samplesArg = args.flags['samples'];
    const sampleCount =
      typeof samplesArg === 'string'
        ? parseCount(samplesArg, '--samples', MIN_SAMPLES, MAX_SAMPLES)
        : DEFAULT_SAMPLES;

    const samples = computeDesigner(A, B, t, range, sampleCount).map((step) => {
      const report = validateTransparency(A, B, step.P, step.Q, t, step.alpha);
      return {
        step,
        summary: {
          alpha: step.alpha,
          P: colorInfo(step.P),
          Q: colorInfo(step.Q),
          valid: report.overallValid,
          quality: report.transparencyQuality,
          juxtaposition: report.juxtapositionType,
        },
      };
    });

    const rows = samples.map(({ step, summary }) => {
      const zones = `${chip(step.P, ctx.color)}${summary.P.hex}  ${chip(step.Q, ctx.color)}${summary.Q.hex}`;
      const verdict = summary.valid ? 'valid' : 'invalid';
      return `  ${percent(summary.alpha).padStart(4)}  ${zones}  ${score(summary.quality).padStart(7)}  ${verdict}`;
    });

    return {
      json: {
        A: colorInfo(A),
        B: colorInfo(B),
        t: colorInfo(t),
        range,
        samples: samples.map(({ summary }) => summary),
      },
      text: [
        heading('Veil', ctx.color),
        swatchWithNotation('A', A, ctx.color),
        swatchWithNotation('B', B, ctx.color),
        swatchWithNotation('t', t, ctx.color),
        heading('alpha   P          Q          quality', ctx.color),
        ...rows,
      ],
    };
  },
};
