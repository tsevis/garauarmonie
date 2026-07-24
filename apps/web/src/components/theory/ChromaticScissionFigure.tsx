import { useState } from 'react';
import type { RGB } from '@garau/engine';
import ChromaticDisk from '../ChromaticDisk';
import MixtureReadout from '../MixtureReadout';

export default function ChromaticScissionFigure() {
  const [color, setColor] = useState<RGB>({ r: 120, g: 90, b: 190 }); // a reddish blue (rB)
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex items-center justify-center rounded-md border border-line bg-panel p-4">
        <ChromaticDisk markers={[{ color, label: '●' }]} onPick={setColor} size={300} />
      </div>
      <div className="rounded-md border border-line bg-panel p-4">
        <MixtureReadout color={color} onPick={setColor} />
      </div>
    </div>
  );
}
