/**
 * `garau analyze` — Garau's visual-mixture reading of one colour, or the
 * juxtaposition and harmony of two.
 */

import {
  analyzeVisualMixture,
  classifyJuxtaposition,
  getComplementaryMixture,
  findSharedSubordinatePartner,
  pairLabel,
} from '@garau/engine';
import type { JuxtapositionAnalysis, RGB } from '@garau/engine';
import { expectPositionals } from '../flags.js';
import { parseColor } from '../parse.js';
import { colorInfo, heading, kv, mixtureLines, score, swatch, swatchWithNotation } from '../format.js';
import type { Command, CommandContext, CommandResult } from '../types.js';
import { NO_FLAGS } from '../types.js';

const USAGE = 'garau analyze <color> [color2]';

function analyzeOne(c: RGB, ctx: CommandContext): CommandResult {
  const mixture = analyzeVisualMixture(c);
  const complement = getComplementaryMixture(c);
  const partner = findSharedSubordinatePartner(c);

  return {
    json: {
      color: colorInfo(c),
      mixture,
      complement: colorInfo(complement),
      sharedSubordinatePartner: colorInfo(partner),
    },
    text: [
      swatch('Color', c, ctx.color, mixture.notation),
      heading('Visual mixture', ctx.color),
      ...mixtureLines(mixture),
      heading('Partners', ctx.color),
      swatchWithNotation('Compl.', complement, ctx.color),
      swatchWithNotation('Shared', partner, ctx.color),
    ],
  };
}

/** JSON for a pair: the type and two readouts for tertiaries, a relation otherwise. */
function pairJson(pair: JuxtapositionAnalysis) {
  const common = {
    kind: pair.kind,
    harmony: pair.harmony,
    harmonyNote: pair.harmonyNote,
    description: pair.description,
  };
  if (pair.kind === 'non-tertiary') return { ...common, relation: pair.relation };
  return {
    ...common,
    type: pair.type,
    degree: pair.degree,
    balance: pair.balance,
    recommendedCorrection: pair.recommendedCorrection,
  };
}

/** Degree and balance lines, shown only for two tertiaries. */
function readoutLines(pair: JuxtapositionAnalysis): readonly string[] {
  if (pair.kind === 'non-tertiary') return [];
  return [
    kv('Degree', pair.degree),
    kv('Balance', `${score(pair.balance.score)} (${pair.balance.balanced ? 'balanced' : 'unbalanced'})`),
  ];
}

function analyzePair(c1: RGB, c2: RGB, ctx: CommandContext): CommandResult {
  const pair = classifyJuxtaposition(c1, c2);
  const correction = pair.kind === 'tertiary' ? pair.recommendedCorrection : null;

  return {
    json: {
      colors: [colorInfo(c1), colorInfo(c2)],
      mixtures: [pair.color1Mixture, pair.color2Mixture],
      pair: pairJson(pair),
    },
    text: [
      swatch('Color 1', c1, ctx.color, pair.color1Mixture.notation),
      swatch('Color 2', c2, ctx.color, pair.color2Mixture.notation),
      heading('Juxtaposition', ctx.color),
      kv(pair.kind === 'tertiary' ? 'Type' : 'Relation', pairLabel(pair)),
      kv('Harmony', pair.harmony),
      kv('Why', pair.harmonyNote),
      kv('Notation', `${pair.color1Mixture.notation} / ${pair.color2Mixture.notation}`),
      ...readoutLines(pair),
      heading('Reading', ctx.color),
      `  ${pair.description}`,
      ...(correction === null ? [] : [`  ${correction}`]),
    ],
  };
}

export const analyzeCommand: Command = {
  name: 'analyze',
  summary: 'Read a colour as a Garau visual mixture, or classify a pair.',
  usage: USAGE,
  details: [
    'With one colour: dominant/subordinate decomposition, Garau notation and',
    'splittability, plus its complement and shared-subordinate partner.',
    'With two tertiaries: Arnheim’s juxtaposition type, Garau’s harmony grouping,',
    'degree of transparency (condition 8) and balance (condition 6). Any other',
    'pair (a grey, a primary, a balanced secondary) gets its relation only.',
  ],
  spec: NO_FLAGS,
  run(args, ctx) {
    const [first, second] = expectPositionals(args, USAGE, 1, 2);
    const c1 = parseColor(first!, 'color');
    if (second === undefined) return analyzeOne(c1, ctx);
    return analyzePair(c1, parseColor(second, 'color2'), ctx);
  },
};
