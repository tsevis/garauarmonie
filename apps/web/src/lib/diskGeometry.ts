// Geometry of the Analyzer's RYB disk (SVG viewBox units).

export const VB = 320;
export const CX = VB / 2;
export const CY = VB / 2;
export const R = 150;
/** Label distance outside the rim. */
export const LABEL_GAP = 16;
/** Room around the disk so rim labels at the top and bottom stay inside the viewBox. */
export const PAD = 18;
export const VIEW = { x: -PAD, y: -PAD, size: VB + 2 * PAD };

// Math-convention placement: 0° at right (east), increasing counter-clockwise.
export const toXY = (angle: number, radius: number): [number, number] => {
  const rad = (angle * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];
};
