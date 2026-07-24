import { useState } from 'react';
import type { RGB } from '@garau/engine';
import { computeForward } from '@garau/engine';
import FourZoneDisplay from '../FourZoneDisplay';

const A: RGB = { r: 214, g: 40, b: 74 };
const B: RGB = { r: 30, g: 150, b: 214 };
const t: RGB = { r: 244, g: 214, b: 96 };
const ALPHA = 0.55;

export default function FourZonesFigure() {
  const [twoBackgrounds, setTwoBackgrounds] = useState(true);
  // With only one background (B ≡ A), P and Q become identical: the figure reads as opaque.
  const effB = twoBackgrounds ? B : A;
  const { P, Q } = computeForward(A, effB, t, ALPHA);

  return (
    <div className="space-y-4">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={twoBackgrounds}
          onChange={(e) => setTwoBackgrounds(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        Show the second background (B)
      </label>
      <div className="rounded-md border border-line bg-panel p-5">
        <FourZoneDisplay A={A} B={effB} P={P} Q={Q} selectedZone={null} onZoneClick={() => {}} />
      </div>
      <p className="rounded-md border border-line bg-panel p-4 text-sm leading-relaxed text-muted">
        {twoBackgrounds
          ? 'Four regions are present — two backgrounds and two overlaps — and the figure reads as a transparent veil.'
          : 'With a single background, the two overlaps collapse to one color. There is no second overlap to establish the scission, so the figure reads as opaque. This is why four regions are necessary.'}
      </p>
    </div>
  );
}
