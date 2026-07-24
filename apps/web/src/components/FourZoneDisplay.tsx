import type { RGB } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';

export type Zone = 'A' | 'B' | 'P' | 'Q';

interface Props {
  A: RGB;
  B: RGB;
  P: RGB;
  Q: RGB;
  selectedZone: Zone | null;
  onZoneClick: (zone: Zone) => void;
}

const W = 560;
const H = 440;
const SPLIT = 288; // A | B boundary

// The transparent figure: a tilted rectangle crossing the boundary. The tilt is
// the "irregularity" Garau insisted is required for transparency to be read.
const FIGURE: ReadonlyArray<readonly [number, number]> = [
  [101, 161],
  [441, 76],
  [499, 309],
  [159, 394],
];
const FIGURE_PTS = FIGURE.map(([x, y]) => `${x},${y}`).join(' ');

// Rough visual centroids of each zone, for label placement.
const LABELS: Record<Zone, { x: number; y: number; big?: boolean }> = {
  A: { x: 120, y: 90 },
  B: { x: 470, y: 90 },
  P: { x: 205, y: 250, big: true },
  Q: { x: 390, y: 235, big: true },
};

export default function FourZoneDisplay({ A, B, P, Q, selectedZone, onZoneClick }: Props) {
  const zoneStyle = (zone: Zone): React.CSSProperties => ({
    cursor: 'pointer',
    filter: selectedZone === zone ? 'brightness(1.08)' : 'none',
    transition: 'filter 0.15s ease',
    outline: 'none',
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-2xl">
        <defs>
          <clipPath id="halfLeft">
            <rect x={0} y={0} width={SPLIT} height={H} />
          </clipPath>
          <clipPath id="halfRight">
            <rect x={SPLIT} y={0} width={W - SPLIT} height={H} />
          </clipPath>
          <filter id="figureShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="3" dy="4" stdDeviation="5" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Backgrounds A (left) and B (right) */}
        <rect x={0} y={0} width={SPLIT} height={H} fill={rgbToCss(A)} style={zoneStyle('A')} onClick={() => onZoneClick('A')} />
        <rect x={SPLIT} y={0} width={W - SPLIT} height={H} fill={rgbToCss(B)} style={zoneStyle('B')} onClick={() => onZoneClick('B')} />

        {/* The figure, drawn with a subtle drop shadow to suggest a layer in front */}
        <g filter="url(#figureShadow)">
          {/* Zone P = figure ∩ A */}
          <polygon points={FIGURE_PTS} clipPath="url(#halfLeft)" fill={rgbToCss(P)} style={zoneStyle('P')} onClick={() => onZoneClick('P')} />
          {/* Zone Q = figure ∩ B */}
          <polygon points={FIGURE_PTS} clipPath="url(#halfRight)" fill={rgbToCss(Q)} style={zoneStyle('Q')} onClick={() => onZoneClick('Q')} />
        </g>

        {/* Figure outline for crisp layer separation */}
        <polygon points={FIGURE_PTS} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={1.25} pointerEvents="none" />

        {/* Background divider (very subtle) */}
        <line x1={SPLIT} y1={0} x2={SPLIT} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth={1} strokeDasharray="5,5" pointerEvents="none" />

        {/* Zone labels */}
        <g pointerEvents="none">
          {(Object.keys(LABELS) as Zone[]).map((zone) => {
            const pos = LABELS[zone];
            const fill = contrastText({ A, B, P, Q }[zone]);
            return (
              <text
                key={zone}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fontSize={pos.big ? 22 : 17}
                fontWeight={pos.big ? 700 : 600}
                fill={fill}
                fontFamily="'IBM Plex Mono', monospace"
              >
                {zone}
              </text>
            );
          })}
        </g>
      </svg>

      <p className="mt-3 text-center text-xs text-muted">
        Click any zone to select it. The tilted, irregular figure is what lets the eye read the
        overlap as a transparent veil — Garau's necessary condition.
      </p>
    </div>
  );
}
