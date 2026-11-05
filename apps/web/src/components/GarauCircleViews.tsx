/**
 * Garau's circle of twelve, drawn three ways: as his ladder (yellow at the top,
 * violet at the bottom, the blue side left and the red side right), as a closed
 * ring, and as on the cover of Le armonie del colore. Every cell is one of his
 * colours; clicking one picks it, and markers sit on the circle colour nearest
 * to theirs.
 */
import type { RGB } from '@garau/engine';
import { GARAU_CIRCLE, garauDiskPlace, hexToRgb, rgbToOklch } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';
import { GARAU_GREY, ON_GREY_MUTED } from '../lib/garauColour';
import type { DiskMarker } from './ChromaticDisk';

interface ViewProps {
  markers?: DiskMarker[];
  onPick?: (color: RGB) => void;
  size?: number;
}

const HEX = Object.fromEntries(GARAU_CIRCLE.map((c) => [c.notation, c.hex])) as Record<string, string>;
const STEP = 360 / GARAU_CIRCLE.length;
const lightness = (n: string): number => rgbToOklch(hexToRgb(HEX[n]!)).L;

/** The circle colour nearest to a colour, by its place on Garau's disk. */
export function nearestCircleNotation(c: RGB): string {
  const { ryb } = garauDiskPlace(c);
  return GARAU_CIRCLE[Math.round(ryb / STEP) % GARAU_CIRCLE.length]!.notation;
}

// Math-convention angles (0° east, counter-clockwise); Y at the top, R lower right, B lower left.
const PLACE = (ryb: number): number => ryb - 30;
const xy = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), -r * Math.sin(a)];
};

/** Annular sector between two angles (degrees, either order) and two radii. */
function band(a0: number, a1: number, r0: number, r1: number): string {
  const [s, e] = a0 < a1 ? [a0, a1] : [a1, a0];
  const large = e - s > 180 ? 1 : 0;
  const p = (d: number, r: number) => xy(d, r).map((v) => v.toFixed(2)).join(' ');
  return `M ${p(s, r1)} A ${r1} ${r1} 0 ${large} 0 ${p(e, r1)} L ${p(e, r0)} A ${r0} ${r0} 0 ${large} 1 ${p(s, r0)} Z`;
}

function Marks({ markers = [], centre }: { markers?: DiskMarker[]; centre: (n: string) => [number, number] }) {
  const seen = new Map<string, number>();
  return (
    <g pointerEvents="none">
      {markers.map((m, i) => {
        const n = nearestCircleNotation(m.color);
        const k = seen.get(n) ?? 0;
        seen.set(n, k + 1);
        const [cx, cy] = centre(n);
        const x = cx + k * 22;
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={11} fill={rgbToCss(m.color)} stroke="#FBFAF8" strokeWidth={2} />
            <circle cx={x} cy={cy} r={12.5} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
            <text x={x} y={cy + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill={contrastText(m.color)}>
              {m.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const pickProps = (n: string, onPick?: (c: RGB) => void) =>
  onPick ? { onClick: () => onPick(hexToRgb(HEX[n]!)), className: 'cursor-pointer' } : {};

const LEFT = ['Y', 'bY', 'YB', 'yB', 'B', 'rB', 'BR'];
const RIGHT = ['Y', 'rY', 'RY', 'yR', 'R', 'bR', 'BR'];
const LADDER = { W: 120, H: 52, X0: 64 } as const;

function ladderCentre(n: string): [number, number] {
  const { W, H, X0 } = LADDER;
  const row = Math.max(LEFT.indexOf(n), RIGHT.indexOf(n));
  const shared = LEFT[row] === RIGHT[row];
  const x = shared ? X0 + W : LEFT.includes(n) ? X0 + W / 2 : X0 + W + W / 2;
  return [x, row * H + H / 2];
}

export function Ladder({ markers, onPick, size }: ViewProps) {
  const { W, H, X0 } = LADDER;
  return (
    <svg viewBox={`0 0 ${X0 + 2 * W + 16} ${LEFT.length * H + 1}`} width={size} height={size} className="mx-auto block w-full max-w-sm">
      {LEFT.map((l, i) => {
        const y = i * H;
        return (
          <g key={i}>
            <text x={X0 - 10} y={y + H / 2 + 4} textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize={11} fill={ON_GREY_MUTED}>
              L {lightness(l).toFixed(2)}
            </text>
            {([[l, X0], [RIGHT[i]!, X0 + W]] as const).map(([n, x]) => (
              <rect key={x} x={x} y={y} width={W} height={H} fill={HEX[n]} stroke={HEX[n]} strokeWidth={0.6} {...pickProps(n, onPick)} />
            ))}
          </g>
        );
      })}
      <Marks markers={markers} centre={ladderCentre} />
    </svg>
  );
}

const RING = { r0: 72, r1: 160 } as const;

export function Ring({ markers, onPick, size }: ViewProps) {
  return (
    <svg viewBox="-170 -170 340 340" width={size} height={size} className="mx-auto block w-full max-w-sm">
      {GARAU_CIRCLE.map(({ notation, hex, ryb }) => (
        <path key={notation} d={band(PLACE(ryb) - STEP / 2, PLACE(ryb) + STEP / 2, RING.r0, RING.r1)} fill={hex} stroke={hex} strokeWidth={0.6} {...pickProps(notation, onPick)} />
      ))}
      <Marks markers={markers} centre={(n) => xy(PLACE(GARAU_CIRCLE.find((c) => c.notation === n)!.ryb), (RING.r0 + RING.r1) / 2)} />
    </svg>
  );
}

// After the cover of Le armonie del colore: three sectors between the primaries,
// each banded inside to outside as tertiary, secondary, tertiary, and the three
// primaries as wedges over the sector boundaries.
const SECTORS: ReadonlyArray<readonly [from: number, to: number, bands: readonly [string, string, string]]> = [
  [120, 0, ['rY', 'RY', 'yR']],
  [0, -120, ['bR', 'BR', 'rB']],
  [-120, -240, ['yB', 'YB', 'bY']],
];
const PRIMARIES: ReadonlyArray<readonly [string, number]> = [['Y', 120], ['R', 0], ['B', 240]];
const RADII = [30, 72, 112, 160] as const;
const WEDGE = { half: 31, r0: 72, r1: 140 } as const;

function coverCentre(n: string): [number, number] {
  const primary = PRIMARIES.find(([p]) => p === n);
  if (primary) return xy(PLACE(primary[1]), (WEDGE.r0 + WEDGE.r1) / 2);
  const [from, to, bands] = SECTORS.find(([, , b]) => b.includes(n))!;
  const i = bands.indexOf(n);
  return xy(PLACE((from + to) / 2), (RADII[i]! + RADII[i + 1]!) / 2);
}

export function Cover({ markers, onPick, size }: ViewProps) {
  return (
    <svg viewBox="-180 -180 360 360" width={size} height={size} className="mx-auto block w-full max-w-sm rounded-md">
      <rect x={-180} y={-180} width={360} height={360} fill={GARAU_GREY} />
      {SECTORS.flatMap(([from, to, bands]) =>
        bands.map((n, i) => (
          <path key={`${n}-${i}`} d={band(PLACE(from), PLACE(to), RADII[i]!, RADII[i + 1]!)} fill={HEX[n]} stroke={HEX[n]} strokeWidth={0.6} {...pickProps(n, onPick)} />
        )),
      )}
      {PRIMARIES.map(([n, ryb]) => (
        <path key={n} d={band(PLACE(ryb) - WEDGE.half, PLACE(ryb) + WEDGE.half, WEDGE.r0, WEDGE.r1)} fill={HEX[n]} stroke={HEX[n]} strokeWidth={0.6} {...pickProps(n, onPick)} />
      ))}
      <Marks markers={markers} centre={coverCentre} />
    </svg>
  );
}
