/**
 * Geometry of the Analyzer's chromatic disk: Garau's yellow-red-blue disk
 * (Klee, Itten), with R, Y and B 120° apart and each secondary halfway.
 *
 * The rim is Garau's own circle (`GARAU_CIRCLE`): his twelve colours at their
 * places, blended in OKLCH between neighbours. Colours are placed by the
 * engine's reading (`oklchHueToRyb`), which uses the same twelve colours, so a
 * label, a plotted colour and the paint beneath it agree with the notation.
 * Angles are in the math convention (0° east, counter-clockwise), rotated so
 * that yellow sits at the top, as on Itten's disk.
 */
import type { RGB } from '@garau/engine';
import { garauDiskColour, garauDiskPlace } from '@garau/engine';

export interface DiskAnchor {
  readonly angle: number;
  readonly label: string;
}

/** Display angle of RYB 0° (red): puts yellow (RYB 120°) at the top (90°). */
const ROTATION = -30;
const RYB_LABELS: ReadonlyArray<readonly [rybAngle: number, label: string]> = [
  [0, 'R'],
  [60, 'RY'],
  [120, 'Y'],
  [180, 'YB'],
  [240, 'B'],
  [300, 'BR'],
];

const toDisplay = (rybAngle: number): number => (((rybAngle + ROTATION) % 360) + 360) % 360;
const toRyb = (displayAngle: number): number => (((displayAngle - ROTATION) % 360) + 360) % 360;

export const ANCHORS: readonly DiskAnchor[] = RYB_LABELS.map(([ryb, label]) => ({
  angle: toDisplay(ryb),
  label,
}));

/** Display angle of a place on the RYB disk. */
export const diskAngleOfRyb = toDisplay;

/** Where a colour sits on the disk: display angle in degrees, radius 0–1 (grey at the centre). */
export function diskPosition(c: RGB): { angle: number; radius: number } {
  const { ryb, radius } = garauDiskPlace(c);
  return { angle: radius === 0 ? 0 : toDisplay(ryb), radius };
}

/** The colour painted at a point of the disk: Garau's circle at the rim, fading toward the centre. */
export function diskColour(angle: number, radius: number): RGB {
  return garauDiskColour(toRyb(angle), radius);
}
