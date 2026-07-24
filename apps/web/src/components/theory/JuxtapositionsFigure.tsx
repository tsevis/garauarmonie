import { useMemo, useState } from 'react';
import type { RGB } from '@garau/engine';
import { classifyJuxtaposition } from '@garau/engine';
import ColorField from '../ColorField';
import ChromaticDisk from '../ChromaticDisk';

export default function JuxtapositionsFigure() {
  const [c1, setC1] = useState<RGB>({ r: 210, g: 120, b: 40 });
  const [c2, setC2] = useState<RGB>({ r: 60, g: 130, b: 180 });
  const analysis = useMemo(() => classifyJuxtaposition(c1, c2), [c1, c2]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">
        <ColorField label="Color 1" value={c1} onChange={setC1} showMixture />
        <ColorField label="Color 2" value={c2} onChange={setC2} showMixture />
        <div className="flex justify-center rounded-md border border-line bg-panel p-3">
          <ChromaticDisk markers={[{ color: c1, label: '1' }, { color: c2, label: '2' }]} size={220} />
        </div>
      </div>
      <div className="space-y-3 rounded-md border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-xl font-semibold text-ink">{analysis.type}</div>
          <div className="font-mono text-lg text-ink">{analysis.transparencyQuality.toFixed(0)}/100</div>
        </div>
        <p className="text-sm leading-relaxed text-muted">{analysis.description}</p>
        {analysis.recommendedCorrection && (
          <p className="rounded-sm bg-paper p-3 text-sm leading-relaxed text-ink">
            <span className="font-semibold">Correction · </span>
            {analysis.recommendedCorrection}
          </p>
        )}
      </div>
    </div>
  );
}
