/**
 * The naming layer. `OpenColorSystem-Proposal.md` §4.4 proposed the van de
 * Weijer probabilistic model here, describing it as "already scoped in
 * Nino's roadmap" — but Nino's own `documents/NinoNextPhase.md` §7
 * explicitly considered and rejected van de Weijer as a downgrade from
 * Nino's existing ~27-family naming. This file is a faithful TypeScript
 * port of that existing, tested scheme —
 * `Sources/NinoCore/Color/ColorNaming.swift` in the Nino repo — rather than
 * a second, competing namer. Every swatch gets a serviceable name at zero
 * marginal labour, exactly as the proposal intended; the model underneath
 * is just the one Nino already trusts.
 *
 * Curated evocative names are deliberately not implemented here: per the
 * proposal §12, a later, additive, code-keyed table can layer names on top
 * without ever touching this file.
 */

import type { OKLCH } from '@garau/engine';
import type { SwatchName } from './types.js';
import { ACHROMATIC_CHROMA } from './grid.js';

export type HueFamily =
  | 'pink' | 'red' | 'orange' | 'amber' | 'yellow' | 'chartreuse' | 'green' | 'emerald'
  | 'cyan' | 'azure' | 'blue' | 'indigo' | 'violet' | 'magenta';

type NeutralFamily = 'black' | 'charcoal' | 'dark grey' | 'grey' | 'light grey' | 'silver' | 'white';

// Bin boundaries are drawn from *measured* OKLCH hue angles of the CSS named
// colours, not from intuition — see `ColorNaming.swift`'s own header comment
// for the measurements that motivated this. Every family contains the
// colour it is named after.
const HUE_BINS: ReadonlyArray<readonly [number, HueFamily]> = [
  [15, 'pink'], [40, 'red'], [75, 'orange'], [100, 'amber'], [122, 'yellow'],
  [139, 'chartreuse'], [162, 'green'], [180, 'emerald'], [210, 'cyan'],
  [240, 'azure'], [272, 'blue'], [295, 'indigo'], [316, 'violet'], [345, 'magenta'],
  [360, 'pink'],
];

function hueFamilyFor(degrees: number): HueFamily {
  let h = degrees % 360;
  if (h < 0) h += 360;
  for (const [upper, family] of HUE_BINS) {
    if (h < upper) return family;
  }
  return 'pink';
}

const NEUTRAL_BINS: ReadonlyArray<readonly [number, NeutralFamily]> = [
  [0.12, 'black'], [0.3, 'charcoal'], [0.5, 'dark grey'], [0.7, 'grey'],
  [0.85, 'light grey'], [0.96, 'silver'], [Infinity, 'white'],
];

function neutralFamilyFor(L: number): NeutralFamily {
  for (const [upper, family] of NEUTRAL_BINS) {
    if (L < upper) return family;
  }
  return 'white';
}

function toneBand(L: number): string {
  if (L < 0.25) return 'deep';
  if (L < 0.45) return 'dark';
  if (L < 0.65) return 'mid';
  if (L < 0.82) return 'light';
  return 'pale';
}

function saturationBand(C: number): string {
  if (C < 0.06) return 'muted';
  if (C < 0.14) return 'normal';
  return 'vivid';
}

/**
 * Common names for a region that are tones rather than hues — teal, olive,
 * maroon, navy, purple, brown. Thresholds are the measured lightnesses of
 * the CSS colours themselves, not a reuse of the tone bands: pure yellow
 * sits at L ≈ 0.968 while pure blue sits at L ≈ 0.452, so "dark for this
 * hue" is not one number.
 */
function aliasesFor(hue: HueFamily, L: number, C: number): string[] {
  switch (hue) {
    case 'red': {
      const out: string[] = [];
      if (L < 0.45) out.push('maroon');
      if (L < 0.58 && C < 0.19) out.push('brown');
      return out;
    }
    case 'orange':
      return L < 0.58 && C < 0.19 ? ['brown'] : [];
    case 'yellow':
    case 'chartreuse':
      return L < 0.7 ? ['olive'] : [];
    case 'cyan':
      return L < 0.65 ? ['teal'] : [];
    case 'blue':
      return L < 0.4 ? ['navy'] : [];
    case 'violet':
    case 'magenta':
      return L < 0.55 ? ['purple'] : [];
    default:
      return [];
  }
}

/** Names an OKLCH colour, matching `ColorNaming.name(_:)` in Nino exactly. */
export function nameOklch(oklch: OKLCH): SwatchName {
  if (oklch.C < ACHROMATIC_CHROMA) {
    const neutral = neutralFamilyFor(oklch.L);
    return { family: neutral, full: neutral, aliases: [] };
  }

  const hue = hueFamilyFor(oklch.h);
  const tone = toneBand(oklch.L);
  const saturation = saturationBand(oklch.C);
  const modifiers = [tone === 'mid' ? '' : tone, saturation === 'normal' ? '' : saturation].filter((s) => s !== '');

  return {
    family: hue,
    full: [...modifiers, hue].join(' '),
    aliases: aliasesFor(hue, oklch.L, oklch.C),
  };
}
