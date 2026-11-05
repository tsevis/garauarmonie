import { useState } from 'react';
import type { RGB } from '@garau/engine';
import ChromaticDisk from '../ChromaticDisk';
import DiskFrame from '../DiskFrame';
import MixtureReadout from '../MixtureReadout';
import { garau } from '../../lib/garauColour';

export default function ChromaticScissionFigure() {
  const [color, setColor] = useState<RGB>(garau('rB'));
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <DiskFrame className="flex items-center justify-center">
        <ChromaticDisk markers={[{ color, label: '●' }]} onPick={setColor} size={300} />
      </DiskFrame>
      <div className="rounded-md border border-line bg-panel p-4">
        <MixtureReadout color={color} onPick={setColor} />
      </div>
    </div>
  );
}
