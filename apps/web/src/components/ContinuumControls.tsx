import type { DominantPrimary } from '@garau/engine';
import { GARAU_CIRCLE } from '@garau/engine';

export const AREAS = ['A', 'B', 'C', 'D'] as const;
const PRIMARIES: DominantPrimary[] = ['Y', 'R', 'B'];

interface Props {
  region: string;
  area: string;
  lock: string | null;
  apexPrimary: DominantPrimary | null;
  onArea: (area: string) => void;
  onLock: (notation: string | null) => void;
  onApex: (primary: DominantPrimary | null) => void;
}

const chip = (active: boolean) =>
  `rounded-xs px-2.5 py-1 text-xs font-medium transition-colors ${
    active ? 'bg-ink text-paper' : 'border border-line text-muted hover:bg-line/60 hover:text-ink'
  }`;

/** Area, colour lock and apex for the selected shape. */
export default function ContinuumControls({ region, area, lock, apexPrimary, onArea, onLock, onApex }: Props) {
  const mixtures = GARAU_CIRCLE.filter((c) => c.notation.length === 2);
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Shape {region.slice(1)}</div>

      <div>
        <div className="mb-1.5 text-xs text-muted">Area · borders inside an area bind, between areas they divide</div>
        <div className="flex gap-1">
          {AREAS.map((a) => (
            <button key={a} type="button" className={chip(area === a)} onClick={() => onArea(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs text-muted">Lock a colour</div>
        <div className="flex flex-wrap gap-1">
          {mixtures.map((c) => (
            <button
              key={c.notation}
              type="button"
              title={c.notation}
              onClick={() => onLock(lock === c.notation ? null : c.notation)}
              className={`h-7 w-7 rounded-xs text-[10px] font-semibold ${lock === c.notation ? 'ring-2 ring-ink ring-offset-1' : ''}`}
              style={{ backgroundColor: c.hex, color: '#2E2B27' }}
            >
              {lock === c.notation ? c.notation : ''}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs text-muted">Apex · the one shape a pure colour may crown</div>
        <div className="flex gap-1">
          {PRIMARIES.map((p) => (
            <button key={p} type="button" className={chip(apexPrimary === p)} onClick={() => onApex(apexPrimary === p ? null : p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
