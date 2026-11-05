/**
 * `garau suggest` — candidate veil colours for a pair of backgrounds, each
 * scored by the transparency it produces at the midpoint alpha.
 */

import { computeForward, suggestTransparentColor, validateTransparency, analyzeVisualMixture } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseAlpha, parseColor } from '../parse.js';
import { chip, colorInfo, heading, percent, score, swatchWithNotation } from '../format.js';
import type { Command } from '../types.js';

const USAGE = 'garau suggest <A> <B>';
const DEFAULT_ALPHA = 0.5;

/** The engine returns its candidates in a fixed order; these name them. */
const LABELS: readonly string[] = [
  'perceptual midpoint',
  'complementary',
  'subtler',
  'more vivid',
  'lighter',
  'darker',
];

/** Valid candidates first, then by balance; the book gives no single quality scale. */
const VALID_FIRST = 1000;
const rank = (e: { readonly valid: boolean; readonly balance: number | null }): number =>
  (e.valid ? VALID_FIRST : 0) + (e.balance ?? 0);

export const suggestCommand: Command = {
  name: 'suggest',
  summary: 'Propose veil colours for two backgrounds, valid and balanced first.',
  usage: USAGE,
  details: [
    'Explores around the perceptual midpoint of A and B in LCH, then scores',
    `each candidate as a veil at alpha ${DEFAULT_ALPHA} (change it with --alpha).`,
  ],
  spec: { valueFlags: ['alpha'], booleanFlags: [] },
  run(args, ctx) {
    const [aArg, bArg] = expectPositionals(args, USAGE, 2);
    const A = parseColor(aArg!, 'A');
    const B = parseColor(bArg!, 'B');

    const alphaArg = args.flags['alpha'];
    const alpha = typeof alphaArg === 'string' ? parseAlpha(alphaArg, '--alpha') : DEFAULT_ALPHA;

    const candidates = suggestTransparentColor(A, B).map((t, index) => {
      const forward = computeForward(A, B, t, alpha);
      const report = validateTransparency(A, B, forward.P, forward.Q, t, alpha);
      return {
        color: t,
        entry: {
          label: LABELS[index] ?? `candidate ${index + 1}`,
          ...colorInfo(t),
          notation: analyzeVisualMixture(t).notation,
          degree: report.degreeOfTransparency,
          balance: report.balance?.score ?? null,
          valid: report.overallValid,
          P: colorInfo(forward.P),
          Q: colorInfo(forward.Q),
        },
      };
    });

    const ranked = [...candidates].sort((a, b) => rank(b.entry) - rank(a.entry));

    return {
      json: {
        A: colorInfo(A),
        B: colorInfo(B),
        alpha,
        candidates: ranked.map(({ entry }) => entry),
      },
      text: [
        heading('Backgrounds', ctx.color),
        swatchWithNotation('A', A, ctx.color),
        swatchWithNotation('B', B, ctx.color),
        heading(`Veil candidates at alpha ${percent(alpha)}`, ctx.color),
        ...ranked.map(
          ({ color, entry }) =>
            `  ${chip(color, ctx.color)}${entry.hex}  ${entry.notation.padEnd(4)} ${(entry.balance === null ? '-' : score(entry.balance)).padStart(7)}  ${(entry.degree ?? '-').padEnd(16)}  ${entry.valid ? 'valid  ' : 'invalid'}  ${entry.label}`,
        ),
      ],
    };
  },
};
