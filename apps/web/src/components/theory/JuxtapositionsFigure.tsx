import { useMemo, useState } from 'react';
import type { RGB } from '@garau/engine';
import { classifyJuxtaposition, pairLabel } from '@garau/engine';
import ColorField from '../ColorField';
import ChromaticDisk from '../ChromaticDisk';
import DiskFrame from '../DiskFrame';
import TransparencyReadouts from '../TransparencyReadouts';
import { garau } from '../../lib/garauColour';

export default function JuxtapositionsFigure() {
  const [c1, setC1] = useState<RGB>(garau('rY'));
  const [c2, setC2] = useState<RGB>(garau('rB'));
  const analysis = useMemo(() => classifyJuxtaposition(c1, c2), [c1, c2]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">
        <ColorField label="Color 1" value={c1} onChange={setC1} showMixture />
        <ColorField label="Color 2" value={c2} onChange={setC2} showMixture />
        <DiskFrame className="flex justify-center">
          <ChromaticDisk markers={[{ color: c1, label: '1' }, { color: c2, label: '2' }]} size={220} />
        </DiskFrame>
      </div>
      <div className="space-y-3 rounded-md border border-line bg-panel p-5">
        <div className="text-xl font-semibold text-ink">{pairLabel(analysis)}</div>
        <p className="text-sm leading-relaxed text-muted">{analysis.description}</p>
        <TransparencyReadouts
          degree={analysis.kind === 'tertiary' ? analysis.degree : null}
          balance={analysis.kind === 'tertiary' ? analysis.balance : null}
          emptyNote="The four juxtapositions hold only between two tertiaries."
        />
        {analysis.kind === 'tertiary' && analysis.recommendedCorrection && (
          <p className="rounded-xs bg-paper p-3 text-sm leading-relaxed text-ink">
            <span className="font-semibold">Correction · </span>
            {analysis.recommendedCorrection}
          </p>
        )}
      </div>
    </div>
  );
}
