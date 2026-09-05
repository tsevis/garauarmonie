/**
 * `garau convert` — one colour in every space the engine speaks, and the
 * WCAG contrast ratio when two are given.
 */

import type { RGB } from '@garau/engine';
import {
  analyzeVisualMixture,
  getContrastRatio,
  getLuminance,
  rgbToHsl,
  rgbToLab,
  rgbToLch,
  rgbToOklab,
  rgbToOklch,
} from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseColor } from '../parse.js';
import { colorInfo, heading, kv, swatch } from '../format.js';
import type { Command, CommandContext } from '../types.js';
import { NO_FLAGS } from '../types.js';

const USAGE = 'garau convert <color> [color2]';

const round = (value: number, digits = 3): number => Number(value.toFixed(digits));

function describe(c: RGB) {
  const hsl = rgbToHsl(c);
  const lab = rgbToLab(c);
  const lch = rgbToLch(c);
  const oklab = rgbToOklab(c);
  const oklch = rgbToOklch(c);
  return {
    ...colorInfo(c),
    hsl: { h: round(hsl.h), s: round(hsl.s), l: round(hsl.l) },
    lab: { l: round(lab.l), a: round(lab.a), b: round(lab.b) },
    lch: { l: round(lch.l), c: round(lch.c), h: round(lch.h) },
    oklab: { L: round(oklab.L, 4), a: round(oklab.a, 4), b: round(oklab.b, 4) },
    oklch: { L: round(oklch.L, 4), C: round(oklch.C, 4), h: round(oklch.h) },
    luminance: round(getLuminance(c), 4),
    notation: analyzeVisualMixture(c).notation,
  };
}

type Description = ReturnType<typeof describe>;

const describeLines = (d: Description, c: RGB, ctx: CommandContext): readonly string[] => [
  swatch('Color', c, ctx.color, d.notation),
  kv('HSL', `${d.hsl.h}, ${d.hsl.s}, ${d.hsl.l}`),
  kv('Lab', `${d.lab.l}, ${d.lab.a}, ${d.lab.b}`),
  kv('LCH', `${d.lch.l}, ${d.lch.c}, ${d.lch.h}`),
  kv('OKLab', `${d.oklab.L}, ${d.oklab.a}, ${d.oklab.b}`),
  kv('OKLCH', `${d.oklch.L}, ${d.oklch.C}, ${d.oklch.h}`),
  kv('Luminance', `${d.luminance}`),
];

export const convertCommand: Command = {
  name: 'convert',
  summary: 'Show a colour in HSL, Lab, LCH, OKLab and OKLCH.',
  usage: USAGE,
  details: ['With two colours, also reports the WCAG contrast ratio between them.'],
  spec: NO_FLAGS,
  run(args, ctx) {
    const [first, second] = expectPositionals(args, USAGE, 1, 2);
    const c1 = parseColor(first!, 'color');
    const c2 = second === undefined ? null : parseColor(second, 'color2');

    const colors = c2 === null ? [c1] : [c1, c2];
    const described = colors.map(describe);
    const contrast = c2 === null ? undefined : round(getContrastRatio(c1, c2), 2);

    const blocks = described.flatMap((d, index) => [
      heading(index === 0 ? 'Color' : 'Color 2', ctx.color),
      ...describeLines(d, colors[index]!, ctx),
    ]);

    return {
      json: { colors: described, ...(contrast === undefined ? {} : { contrast }) },
      text: [
        ...blocks,
        ...(contrast === undefined
          ? []
          : [heading('Contrast', ctx.color), kv('WCAG ratio', `${contrast}:1`)]),
      ],
    };
  },
};
