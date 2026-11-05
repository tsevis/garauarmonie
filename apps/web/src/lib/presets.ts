/**
 * Curated transparency presets. Each label (juxtaposition type and degree of
 * transparency) is what @garau/engine reports for the display — checked by
 * `apps/web/test/presets.test.ts`. Since 2026-11-04 every preset is built from
 * Garau's twelve colours (`GARAU_CIRCLE`), read in the linear-light Metelli model. The "studies" are original compositions in
 * Garau's spirit, not reproductions of book plates.
 */
import type { JuxtapositionType, TransparencyConfig, TransparencyDegree } from '@garau/engine';
import { hexToRgb } from '@garau/engine';

export interface Preset {
  id: string;
  name: string;
  A: string;
  B: string;
  t: string;
  alpha: number;
  /** The P–Q juxtaposition type; null when P and Q are not two tertiaries. */
  jt: JuxtapositionType | null;
  /** Garau's condition 8 for the display; null when it does not apply. */
  degree: TransparencyDegree | null;
}

/** Convert a stored preset to an engine TransparencyConfig. */
export function presetToConfig(p: Pick<Preset, 'A' | 'B' | 't' | 'alpha'>): TransparencyConfig {
  return { A: hexToRgb(p.A), B: hexToRgb(p.B), t: hexToRgb(p.t), alpha: p.alpha };
}

const VERY: TransparencyDegree = 'Very transparent';
const MID: TransparencyDegree = 'Intermediate';
const OPAQUE: TransparencyDegree = 'Nearly opaque';

export const STUDIES: Preset[] = [
  { id: 'study-red', name: 'Red veil over yellow & blue, clear', A: '#FFDC56', B: '#567F9A', t: '#C84650', alpha: 0.75, jt: 'Shared Subordinate', degree: VERY },
  { id: 'study-violet', name: 'Violet veil over yellow & blue', A: '#FFDC56', B: '#567F9A', t: '#623D5D', alpha: 0.3, jt: 'Shared Subordinate', degree: VERY },
  { id: 'study-blue-violet', name: 'Blue-violet veil over red & yellow-green', A: '#C84650', B: '#C0CE69', t: '#5E5C8A', alpha: 0.58, jt: 'Shared Subordinate', degree: VERY },
];

const SS_1: Preset = { id: 'ss-1', name: 'Violet veil over yellow-orange & blue-violet', A: '#FFB33B', B: '#5E5C8A', t: '#623D5D', alpha: 0.67, jt: 'Shared Subordinate', degree: VERY };
const SD_1: Preset = { id: 'sd-1', name: 'Red veil over yellow & blue, dense', A: '#FFDC56', B: '#567F9A', t: '#C84650', alpha: 0.2, jt: 'Shared Dominant', degree: OPAQUE };

export const BY_TYPE: Record<JuxtapositionType, Preset[]> = {
  'Shared Subordinate': [
    SS_1,
    { id: 'ss-2', name: 'Blue veil over orange & yellow', A: '#F9892C', B: '#FFDC56', t: '#567F9A', alpha: 0.28, jt: 'Shared Subordinate', degree: VERY },
  ],
  'Shared Dominant': [
    SD_1,
    { id: 'sd-2', name: 'Red veil over orange & blue', A: '#F9892C', B: '#567F9A', t: '#C84650', alpha: 0.37, jt: 'Shared Dominant', degree: OPAQUE },
  ],
  'Complete Inversion': [
    { id: 'ci-1', name: 'Blue veil over red & red-orange', A: '#C84650', B: '#ED5D2F', t: '#567F9A', alpha: 0.27, jt: 'Complete Inversion', degree: MID },
    { id: 'ci-2', name: 'Red veil over yellow-orange & yellow-green', A: '#FFB33B', B: '#C0CE69', t: '#C84650', alpha: 0.37, jt: 'Complete Inversion', degree: MID },
  ],
  'Partial Inversion': [
    { id: 'pi-1', name: 'Violet veil over yellow & blue-green', A: '#FFDC56', B: '#5AA097', t: '#623D5D', alpha: 0.15, jt: 'Partial Inversion', degree: MID },
    { id: 'pi-2', name: 'Green veil over red-orange & blue-green', A: '#ED5D2F', B: '#5AA097', t: '#84BB81', alpha: 0.55, jt: 'Partial Inversion', degree: MID },
  ],
};

export interface DegreeGroup {
  degree: TransparencyDegree;
  label: string;
  blurb: string;
  presets: Preset[];
}

// Garau's condition 8: the role of the common colour, not α, sets the degree.
export const BY_DEGREE: DegreeGroup[] = [
  {
    degree: VERY,
    label: 'Very transparent',
    blurb: 'The common colour is subordinate in both overlaps (shared subordinate): the veil reads clearly and lightly.',
    presets: [
      { ...SS_1, id: 'deg-very-1' },
      { ...STUDIES[2]!, id: 'deg-very-2' },
    ],
  },
  {
    degree: MID,
    label: 'Intermediate',
    blurb: 'The common colour is dominant in one overlap and subordinate in the other (the inversions); the book gives no degree, and the ground absorbs the excess.',
    presets: [
      { id: 'deg-semi-1', name: 'Crimson veil over yellow & blue-violet', A: '#FFDC56', B: '#5E5C8A', t: '#95435D', alpha: 0.3, jt: 'Partial Inversion', degree: MID },
      { id: 'deg-semi-2', name: 'Yellow veil over green & blue-green', A: '#84BB81', B: '#5AA097', t: '#FFDC56', alpha: 0.88, jt: 'Complete Inversion', degree: MID },
    ],
  },
  {
    degree: OPAQUE,
    label: 'Nearly opaque',
    blurb: 'The common colour is dominant in both overlaps (shared dominant): unified and balanced, but little transparent.',
    presets: [
      { ...SD_1, id: 'deg-op-1' },
      { id: 'deg-op-2', name: 'Green veil over red & yellow-green', A: '#C84650', B: '#C0CE69', t: '#84BB81', alpha: 0.54, jt: 'Shared Dominant', degree: OPAQUE },
    ],
  },
];
