import { useId } from 'react';
import type { RGB } from '@garau/engine';
import { computeForward } from '@garau/engine';
import { rgbToCss } from '../lib/color';

/** A small, non-interactive four-zone preview of a transparency config. */
export default function PresetThumb({ A, B, t, alpha }: { A: RGB; B: RGB; t: RGB; alpha: number }) {
  const uid = useId().replace(/:/g, '');
  const { P, Q } = computeForward(A, B, t, alpha);
  const W = 160;
  const H = 110;
  const split = W * 0.52;
  const figure = '30,34 118,20 132,86 44,98';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <clipPath id={`l-${uid}`}>
          <rect x={0} y={0} width={split} height={H} />
        </clipPath>
        <clipPath id={`r-${uid}`}>
          <rect x={split} y={0} width={W - split} height={H} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={split} height={H} fill={rgbToCss(A)} />
      <rect x={split} y={0} width={W - split} height={H} fill={rgbToCss(B)} />
      <polygon points={figure} clipPath={`url(#l-${uid})`} fill={rgbToCss(P)} />
      <polygon points={figure} clipPath={`url(#r-${uid})`} fill={rgbToCss(Q)} />
      <polygon points={figure} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={0.75} />
    </svg>
  );
}
