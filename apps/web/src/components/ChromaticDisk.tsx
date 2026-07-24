import { useRef } from 'react';
import type { RGB } from '@garau/engine';
import { rgbToHsl, hslToRgb } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';

export interface DiskMarker {
  color: RGB;
  label: string;
}

interface Props {
  markers: DiskMarker[];
  /** Called with a new color when the user clicks inside the disk. */
  onPick?: (color: RGB) => void;
  /** Lightness (0–100) to hold constant when picking. Defaults to 55. */
  pickLightness?: number;
  size?: number;
}

const VB = 320; // viewBox units
const CX = VB / 2;
const CY = VB / 2;
const R = 150;

// Garau's three primaries and three balanced secondaries, at the engine's hue angles.
const ANCHORS: { hue: number; label: string }[] = [
  { hue: 0, label: 'R' },
  { hue: 30, label: 'RY' },
  { hue: 60, label: 'Y' },
  { hue: 150, label: 'YB' },
  { hue: 240, label: 'B' },
  { hue: 270, label: 'BR' },
];

// Math-convention placement: 0° at right (east), increasing counter-clockwise.
const toXY = (hue: number, radius: number): [number, number] => {
  const rad = (hue * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];
};

function sector(a0: number, a1: number): string {
  const [x1, y1] = toXY(a0, R);
  const [x2, y2] = toXY(a1, R);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

const STEP = 5;
const SECTORS = Array.from({ length: 360 / STEP }, (_, i) => i * STEP);

export default function ChromaticDisk({ markers, onPick, pickLightness = 55, size = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * VB;
    const my = ((e.clientY - rect.top) / rect.height) * VB;
    const dx = mx - CX;
    const dy = CY - my; // invert to math convention
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > R) return; // outside the disk
    let hue = (Math.atan2(dy, dx) * 180) / Math.PI;
    hue = (hue + 360) % 360;
    const sat = Math.min(100, (dist / R) * 100);
    onPick(hslToRgb({ h: hue, s: sat, l: pickLightness }));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      className={`mx-auto block ${onPick ? 'cursor-crosshair' : ''}`}
      onClick={handleClick}
    >
      <defs>
        <radialGradient id="diskFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBFAF8" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#FBFAF8" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#FBFAF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hue wheel */}
      <g>
        {SECTORS.map((a) => (
          <path key={a} d={sector(a, a + STEP)} fill={`hsl(${a + STEP / 2}, 82%, 55%)`} />
        ))}
      </g>
      {/* Desaturation toward the center */}
      <circle cx={CX} cy={CY} r={R} fill="url(#diskFade)" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />

      {/* Primary / secondary anchor ticks and labels */}
      <g pointerEvents="none">
        {ANCHORS.map(({ hue, label }) => {
          const [lx, ly] = toXY(hue, R + 16);
          const [tx, ty] = toXY(hue, R);
          const isPrimary = label.length === 1;
          return (
            <g key={label}>
              <line x1={CX} y1={CY} x2={tx} y2={ty} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
              <text
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize={isPrimary ? 15 : 11}
                fontWeight={isPrimary ? 700 : 500}
                fill={isPrimary ? '#1F1D1A' : '#6B6660'}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Plotted color markers */}
      <g pointerEvents="none">
        {markers.map((m, i) => {
          const hsl = rgbToHsl(m.color);
          const [x, y] = toXY(hsl.h, (hsl.s / 100) * R);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={14} fill={rgbToCss(m.color)} stroke="#FBFAF8" strokeWidth={2.5} />
              <circle cx={x} cy={y} r={15.5} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fontFamily="'IBM Plex Mono', monospace"
                fill={contrastText(m.color)}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
