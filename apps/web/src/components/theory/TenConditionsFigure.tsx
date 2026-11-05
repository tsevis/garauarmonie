import { useMemo, useState } from 'react';
import type { RGB } from '@garau/engine';
import { computeForward, validateTransparency } from '@garau/engine';
import ColorField from '../ColorField';
import AlphaSlider from '../AlphaSlider';
import FourZoneDisplay from '../FourZoneDisplay';
import ValidityDashboard from '../ValidityDashboard';
import { garau } from '../../lib/garauColour';

export default function TenConditionsFigure() {
  // Opens on a valid transparency; edit any input to see conditions fail.
  const [A, setA] = useState<RGB>(garau('Y'));
  const [B, setB] = useState<RGB>(garau('B'));
  const [t, setT] = useState<RGB>(garau('R'));
  const [alpha, setAlpha] = useState(0.75); // Garau's thin red veil over yellow and blue: a shared subordinate

  const { P, Q } = useMemo(() => computeForward(A, B, t, alpha), [A, B, t, alpha]);
  const report = useMemo(() => validateTransparency(A, B, P, Q, t, alpha), [A, B, P, Q, t, alpha]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
      <div className="space-y-4">
        <ColorField label="A" value={A} onChange={setA} showMixture />
        <ColorField label="B" value={B} onChange={setB} showMixture />
        <ColorField label="t" value={t} onChange={setT} showMixture />
        <AlphaSlider value={alpha} onChange={setAlpha} />
      </div>
      <div className="rounded-md border border-line bg-panel p-5">
        <FourZoneDisplay A={A} B={B} P={P} Q={Q} selectedZone={null} onZoneClick={() => {}} />
      </div>
      <div className="rounded-md border border-line bg-panel p-4">
        <ValidityDashboard report={report} />
      </div>
    </div>
  );
}
