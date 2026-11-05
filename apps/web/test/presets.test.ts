// Catches Gallery presets whose labelled type or degree is not what the
// engine reports for the same display (they were tuned to the old HSL wheel).
import { describe, it, expect } from 'vitest';
import { computeForward, validateTransparency } from '@garau/engine';
import type { ValidationReport } from '@garau/engine';
import { BY_DEGREE, BY_TYPE, STUDIES, presetToConfig } from '../src/lib/presets';
import type { Preset } from '../src/lib/presets';

function engineReading(p: Preset): ValidationReport {
  const { A, B, t, alpha } = presetToConfig(p);
  const { P, Q } = computeForward(A, B, t, alpha);
  return validateTransparency(A, B, P, Q, t, alpha);
}

const ALL: readonly Preset[] = [
  ...STUDIES,
  ...Object.values(BY_TYPE).flat(),
  ...BY_DEGREE.flatMap((g) => g.presets),
];

describe('every Gallery preset is labelled with what the engine reads', () => {
  it.each(ALL.map((p) => [p.id, p] as const))('%s: type and degree match the engine', (_id, p) => {
    const r = engineReading(p);
    expect({ type: p.jt, degree: p.degree }).toEqual({
      type: r.juxtapositionType,
      degree: r.degreeOfTransparency,
    });
  });

  it.each(ALL.map((p) => [p.id, p] as const))('%s: is a valid transparency', (_id, p) => {
    expect(engineReading(p).overallValid).toBe(true);
  });

  it('each type group holds only presets of that type', () => {
    for (const [type, presets] of Object.entries(BY_TYPE)) {
      for (const p of presets) expect(engineReading(p).juxtapositionType).toBe(type);
    }
  });

  it('each degree group holds only presets of that degree', () => {
    for (const group of BY_DEGREE) {
      for (const p of group.presets) expect(engineReading(p).degreeOfTransparency).toBe(group.degree);
    }
  });
});
