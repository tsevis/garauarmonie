import type { RGB } from '@garau/engine';
import { rgbToCss } from '../lib/color';

export interface VeilLayer {
  id: string;
  t: RGB;
  alpha: number;
}

interface Props {
  A: RGB;
  B: RGB;
  layers: VeilLayer[];
  /** 0–1: how much smaller each nested plane is than the one beneath it. */
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const W = 560;
const H = 440;
const SPLIT = 288;
const CX = 278;
const CY = 220;
const HW0 = 212;
const HH0 = 156;

function rectPoly(hw: number, hh: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (
    [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ] as const
  )
    .map(([dx, dy]) => `${(CX + dx * c - dy * s).toFixed(1)},${(CY + dx * s + dy * c).toFixed(1)}`)
    .join(' ');
}

/**
 * Renders A|B backgrounds with the veils drawn as nested, tilted, translucent
 * rectangles (opacity = 1−α). The renderer's source-over compositing reproduces
 * Metelli's averaging exactly, so what is drawn equals what the engine computes
 * for each accumulated plane.
 */
export default function StackDisplay({ A, B, layers, depth, selectedId, onSelect }: Props) {
  const step = 0.1 + depth * 0.16; // fraction each plane shrinks

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-2xl" onClick={() => onSelect(null)}>
      <defs>
        <filter id="planeShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="4" dy="5" stdDeviation="6" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Backgrounds */}
      <rect x={0} y={0} width={SPLIT} height={H} fill={rgbToCss(A)} />
      <rect x={SPLIT} y={0} width={W - SPLIT} height={H} fill={rgbToCss(B)} />
      <line x1={SPLIT} y1={0} x2={SPLIT} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth={1} strokeDasharray="5,5" />

      {/* Veils: largest (deepest) first, smaller ones drawn over them */}
      {layers.map((layer, i) => {
        const scale = Math.max(0.14, 1 - i * step);
        const pts = rectPoly(HW0 * scale, HH0 * scale, -14 + i * 8);
        const selected = layer.id === selectedId;
        return (
          <g key={layer.id} filter="url(#planeShadow)" style={{ cursor: 'pointer' }}>
            <polygon
              points={pts}
              fill={rgbToCss(layer.t)}
              fillOpacity={1 - layer.alpha}
              stroke={selected ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.28)'}
              strokeWidth={selected ? 2 : 1.1}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected ? null : layer.id);
              }}
            />
          </g>
        );
      })}

      {/* Plane index badges, near each plane's top-left corner */}
      {layers.map((layer, i) => {
        const scale = Math.max(0.14, 1 - i * step);
        const a = ((-14 + i * 8) * Math.PI) / 180;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const dx = -HW0 * scale + 16;
        const dy = -HH0 * scale + 16;
        const x = CX + dx * c - dy * s;
        const y = CY + dx * s + dy * c;
        return (
          <text
            key={`lbl-${layer.id}`}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fontFamily="'IBM Plex Mono', monospace"
            fill="rgba(0,0,0,0.55)"
            pointerEvents="none"
          >
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}
