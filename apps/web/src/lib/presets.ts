/**
 * Curated transparency presets. Each was found by searching @garau/engine for
 * valid, high-quality configurations, then grouped by Arnheim juxtaposition
 * type and by transparency degree. The "studies" are original compositions in
 * Garau's spirit — not reproductions of specific book plates.
 */
import type { JuxtapositionType, TransparencyConfig } from '@garau/engine';
import { hexToRgb } from '@garau/engine';

export interface Preset {
  id: string;
  name: string;
  A: string;
  B: string;
  t: string;
  alpha: number;
  jt: JuxtapositionType;
  quality: number;
}

/** Convert a stored preset to an engine TransparencyConfig. */
export function presetToConfig(p: Pick<Preset, 'A' | 'B' | 't' | 'alpha'>): TransparencyConfig {
  return { A: hexToRgb(p.A), B: hexToRgb(p.B), t: hexToRgb(p.t), alpha: p.alpha };
}

export const STUDIES: Preset[] = [
  { id: 'study-coral', name: 'Coral veil over crimson & sky', A: '#DD1442', B: '#0BA0E4', t: '#F37172', alpha: 0.625, jt: 'Shared Subordinate', quality: 93 },
  { id: 'study-lime', name: 'Violet veil over lime & indigo', A: '#BBDD2F', B: '#4035B1', t: '#A521F4', alpha: 0.717, jt: 'Shared Subordinate', quality: 94 },
  { id: 'study-gold', name: 'Grey veil over gold & aqua', A: '#F2D328', B: '#68A6E5', t: '#BABDDD', alpha: 0.343, jt: 'Shared Subordinate', quality: 93 },
];

export const BY_TYPE: Record<JuxtapositionType, Preset[]> = {
  'Shared Subordinate': [
    { id: 'ss-1', name: 'Lime & indigo, near-black veil', A: '#C8E029', B: '#62399A', t: '#1E1E2D', alpha: 0.29, jt: 'Shared Subordinate', quality: 94 },
    { id: 'ss-2', name: 'Chartreuse & indigo, orchid veil', A: '#A1D741', B: '#37348B', t: '#BE61B1', alpha: 0.738, jt: 'Shared Subordinate', quality: 94 },
  ],
  'Shared Dominant': [
    { id: 'sd-1', name: 'Red & green, blue veil', A: '#F63052', B: '#056035', t: '#0138B0', alpha: 0.328, jt: 'Shared Dominant', quality: 87 },
    { id: 'sd-2', name: 'Slate & azure, pale veil', A: '#7D78A0', B: '#4083D6', t: '#B3E8F7', alpha: 0.673, jt: 'Shared Dominant', quality: 87 },
  ],
  'Complete Inversion': [
    { id: 'ci-1', name: 'Azure & green, mauve veil', A: '#348DC7', B: '#59CA18', t: '#765B60', alpha: 0.517, jt: 'Complete Inversion', quality: 77 },
    { id: 'ci-2', name: 'Periwinkle & lime, grey veil', A: '#C4CEFE', B: '#B3DC42', t: '#B4D5D6', alpha: 0.468, jt: 'Complete Inversion', quality: 77 },
  ],
  'Partial Inversion': [
    { id: 'pi-1', name: 'Blush & jade, indigo veil', A: '#F5BAB1', B: '#1AD99C', t: '#3018C4', alpha: 0.317, jt: 'Partial Inversion', quality: 74 },
    { id: 'pi-2', name: 'Cyan & slate, violet veil', A: '#47C9E7', B: '#3C488B', t: '#7418B2', alpha: 0.575, jt: 'Partial Inversion', quality: 74 },
  ],
};

export interface DegreeGroup {
  key: 'very' | 'semi' | 'opaque';
  label: string;
  blurb: string;
  presets: Preset[];
}

export const BY_DEGREE: DegreeGroup[] = [
  {
    key: 'very',
    label: 'Very transparent',
    blurb: 'Low α — the veil barely tints the backgrounds; the common color reads as subordinate.',
    presets: [
      { id: 'deg-very-1', name: 'Lime & indigo, near-black veil', A: '#C8E029', B: '#62399A', t: '#1E1E2D', alpha: 0.29, jt: 'Shared Subordinate', quality: 94 },
      { id: 'deg-very-2', name: 'Gold & aqua, pale veil', A: '#F2D328', B: '#68A6E5', t: '#BABDDD', alpha: 0.343, jt: 'Shared Subordinate', quality: 93 },
    ],
  },
  {
    key: 'semi',
    label: 'Semi-transparent',
    blurb: 'Mid α — a clear, balanced veil; the classic transparency impression.',
    presets: [
      { id: 'deg-semi-1', name: 'Yellow & violet, steel veil', A: '#FCDF23', B: '#7260A2', t: '#93BDCE', alpha: 0.422, jt: 'Shared Subordinate', quality: 93 },
      { id: 'deg-semi-2', name: 'Lavender & scarlet, teal veil', A: '#B5AAE8', B: '#C9210D', t: '#7BC1C2', alpha: 0.48, jt: 'Shared Subordinate', quality: 93 },
    ],
  },
  {
    key: 'opaque',
    label: 'Nearly opaque',
    blurb: 'High α — the veil dominates; the transparency is only just readable.',
    presets: [
      { id: 'deg-op-1', name: 'Lime & indigo, violet veil', A: '#BBDD2F', B: '#4035B1', t: '#A521F4', alpha: 0.717, jt: 'Shared Subordinate', quality: 94 },
      { id: 'deg-op-2', name: 'Indigo & amber, green veil', A: '#3D38B9', B: '#A55F12', t: '#4FCE59', alpha: 0.738, jt: 'Shared Subordinate', quality: 93 },
    ],
  },
];
