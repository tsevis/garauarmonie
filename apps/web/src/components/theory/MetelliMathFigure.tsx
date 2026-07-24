import { useMemo, useState } from 'react';
import type { RGB } from '@garau/engine';
import { computeForward } from '@garau/engine';
import ColorField from '../ColorField';
import AlphaSlider from '../AlphaSlider';
import FourZoneDisplay from '../FourZoneDisplay';
import { rgbToCss } from '../../lib/color';

function Chip({ c, label }: { c: RGB; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="inline-block h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: rgbToCss(c) }} />
      <span className="font-mono text-sm">{label}</span>
    </span>
  );
}

export default function MetelliMathFigure() {
  const [A, setA] = useState<RGB>({ r: 214, g: 40, b: 74 });
  const [B, setB] = useState<RGB>({ r: 30, g: 150, b: 214 });
  const [t, setT] = useState<RGB>({ r: 244, g: 214, b: 96 });
  const [alpha, setAlpha] = useState(0.5);
  const { P, Q } = useMemo(() => computeForward(A, B, t, alpha), [A, B, t, alpha]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">
        <ColorField label="A" sublabel="background 1" value={A} onChange={setA} />
        <ColorField label="B" sublabel="background 2" value={B} onChange={setB} />
        <ColorField label="t" sublabel="veil" value={t} onChange={setT} />
        <AlphaSlider value={alpha} onChange={setAlpha} />
      </div>
      <div className="space-y-4">
        <div className="rounded-md border border-line bg-panel p-5">
          <FourZoneDisplay A={A} B={B} P={P} Q={Q} selectedZone={null} onZoneClick={() => {}} />
        </div>
        <div className="space-y-2 rounded-md border border-line bg-panel p-4 font-mono text-sm text-ink">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Chip c={P} label="P" /> = {alpha.toFixed(2)}·<Chip c={A} label="A" /> + {(1 - alpha).toFixed(2)}·<Chip c={t} label="t" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Chip c={Q} label="Q" /> = {alpha.toFixed(2)}·<Chip c={B} label="B" /> + {(1 - alpha).toFixed(2)}·<Chip c={t} label="t" />
          </div>
          <p className="pt-1 font-sans text-xs text-muted">
            Each equation runs independently on the R, G and B channels. Inverting them recovers t and α from an
            existing display — the basis of the Composer’s Inverse mode.
          </p>
        </div>
      </div>
    </div>
  );
}
