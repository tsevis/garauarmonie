/**
 * Shared rendering of a `ValidationReport` — the same block is printed by
 * `compose`, `inverse` and `validate`, so it lives in one place.
 */

import type { ValidationReport } from '@garau/engine';
import { bullets, heading, kv, mark, score } from './format.js';
import { EXIT } from './errors.js';

const CONDITIONS: ReadonlyArray<readonly [string, keyof ValidationReport]> = [
  ['Scission realizable', 'scissionRealizable'],
  ['Topology preserved', 'topologyPreserved'],
  ['Contrast reduction', 'contrastReduction'],
  ['Four regions', 'fourRegions'],
  ['Visual mixture P', 'visualMixtureP'],
  ['Visual mixture Q', 'visualMixtureQ'],
  ['Unbalanced preference', 'unbalancedPreference'],
  ['Common colour exists', 'commonColorExists'],
  ['Divergent colours exist', 'divergentColorsExist'],
  ['Balanced transparency', 'balancedTransparency'],
  ['Alpha consistency', 'alphaConsistency'],
];

/** The headline: verdict, quality score and juxtaposition type. */
export function verdictLines(report: ValidationReport, color: boolean): readonly string[] {
  return [
    heading('Validity', color),
    kv('Verdict', report.overallValid ? 'valid transparency' : 'NOT a valid transparency'),
    kv('Transparency quality', score(report.transparencyQuality)),
    kv('Juxtaposition', report.juxtapositionType ?? 'unknown'),
  ];
}

/** Every named condition, plus warnings and suggestions. */
export function reportLines(
  report: ValidationReport,
  color: boolean,
  options: { readonly conditions: boolean } = { conditions: false },
): readonly string[] {
  const conditions = options.conditions
    ? [
        heading('Conditions', color),
        ...CONDITIONS.map(([label, key]) => kv(label, mark(report[key] as boolean | null))),
      ]
    : [];

  const warnings =
    report.warnings.length === 0 ? [] : [heading('Warnings', color), ...bullets(report.warnings)];
  const suggestions =
    report.suggestions.length === 0
      ? []
      : [heading('Suggestions', color), ...bullets(report.suggestions)];

  return [...verdictLines(report, color), ...conditions, ...warnings, ...suggestions];
}

/** Exit 1 when the engine says the configuration is not a valid transparency. */
export const exitFor = (report: ValidationReport): number =>
  report.overallValid ? EXIT.ok : EXIT.invalid;
