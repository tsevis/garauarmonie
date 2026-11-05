import type { RGB } from '@garau/engine';
import { GARAU_CIRCLE, hexToRgb } from '@garau/engine';

/** One of the twelve colours of Garau's circle, by its notation (Y, rY, RY, …). */
export function garau(notation: string): RGB {
  const c = GARAU_CIRCLE.find((x) => x.notation === notation);
  if (!c) throw new Error(`No colour ${notation} in Garau's circle`);
  return hexToRgb(c.hex);
}

/** The mid grey of the cover of Le armonie del colore: the ground every view of the circle sits on. */
export const GARAU_GREY = '#8E8A86';
/** Secondary text on that grey (the app's muted ink is too light on it). */
export const ON_GREY_MUTED = '#2E2B27';
