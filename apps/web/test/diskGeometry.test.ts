// Catches rim labels drawn outside the disk's viewBox (Y and RB were clipped).
import { describe, it, expect } from 'vitest';
import { ANCHORS } from '../src/lib/rybDisk';
import { LABEL_GAP, R, VIEW, toXY } from '../src/lib/diskGeometry';

const FONT_HALF = 9; // half the primary label's font size, rounded up

describe('disk labels', () => {
  it('every rim label lies inside the viewBox', () => {
    const outside = ANCHORS.filter(({ angle }) => {
      const [x, y] = toXY(angle, R + LABEL_GAP);
      return y - FONT_HALF < VIEW.y || y + FONT_HALF > VIEW.y + VIEW.size || x < VIEW.x || x > VIEW.x + VIEW.size;
    }).map((a) => a.label);
    expect(outside).toEqual([]);
  });
});
