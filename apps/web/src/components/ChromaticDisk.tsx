import { useRef, useState } from 'react';
import type { RGB } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';
import { ANCHORS, diskColour, diskPosition } from '../lib/rybDisk';
import { CX, CY, LABEL_GAP, R, VIEW, toXY } from '../lib/diskGeometry';
import { Cover, Ladder } from './GarauCircleViews';
import { GARAU_GREY, ON_GREY_MUTED } from '../lib/garauColour';

export interface DiskMarker {
  color: RGB;
  label: string;
}

interface Props {
  markers: DiskMarker[];
  /** Called with a new color when the user clicks inside the disk. */
  onPick?: (color: RGB) => void;
  size?: number;
}

function sector(a0: number, a1: number): string {
  const [x1, y1] = toXY(a0, R);
  const [x2, y2] = toXY(a1, R);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

const STEP = 5;
// Garau's RYB disk, painted by the engine's own hue mapping (see lib/rybDisk).
const SECTORS = Array.from({ length: 360 / STEP }, (_, i) => ({
  angle: i * STEP,
  fill: rgbToCss(diskColour(i * STEP + STEP / 2, 1)),
}));

function ContinuousDisk({ markers, onPick, size = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = VIEW.x + ((e.clientX - rect.left) / rect.width) * VIEW.size;
    const my = VIEW.y + ((e.clientY - rect.top) / rect.height) * VIEW.size;
    const dx = mx - CX;
    const dy = CY - my; // invert to math convention
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > R) return; // outside the disk
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    onPick(diskColour(angle, dist / R));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`}
      width={size}
      height={size}
      className={`mx-auto block ${onPick ? 'cursor-crosshair' : ''}`}
      onClick={handleClick}
    >
      <defs>
        <radialGradient id="diskFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GARAU_GREY} stopOpacity="0.95" />
          <stop offset="42%" stopColor={GARAU_GREY} stopOpacity="0.25" />
          <stop offset="70%" stopColor={GARAU_GREY} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* RYB disk */}
      <g>
        {SECTORS.map(({ angle, fill }) => (
          <path key={angle} d={sector(angle, angle + STEP)} fill={fill} />
        ))}
      </g>
      {/* Desaturation toward the center */}
      <circle cx={CX} cy={CY} r={R} fill="url(#diskFade)" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />

      {/* Primary / secondary anchor ticks and labels */}
      <g pointerEvents="none">
        {ANCHORS.map(({ angle, label }) => {
          const [lx, ly] = toXY(angle, R + LABEL_GAP);
          const [tx, ty] = toXY(angle, R);
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
                fill={isPrimary ? '#1F1D1A' : ON_GREY_MUTED}
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
          const pos = diskPosition(m.color);
          const [x, y] = toXY(pos.angle, pos.radius * R);
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

type View = 'disk' | 'ladder' | 'cover';
const VIEWS: ReadonlyArray<readonly [View, string]> = [
  ['disk', 'Disk'],
  ['ladder', 'Ladder'],
  ['cover', 'As on the cover'],
];

/** Garau's disk, with his ladder and the cover's circle as two other views of the same twelve colours. */
export default function ChromaticDisk({ markers, onPick, size = 300 }: Props) {
  const [view, setView] = useState<View>('disk');
  return (
    <div style={{ width: size }} className="mx-auto space-y-3">
      <div className="flex justify-center gap-1">
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-xs px-2.5 py-1 text-xs ${view === v ? 'bg-ink text-paper' : 'text-ink/75 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'disk' && <ContinuousDisk markers={markers} onPick={onPick} size={size} />}
      {view === 'ladder' && <Ladder markers={markers} onPick={onPick} size={size} />}
      {view === 'cover' && <Cover markers={markers} onPick={onPick} size={size} />}
    </div>
  );
}
