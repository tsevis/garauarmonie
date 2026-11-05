import { useState } from 'react';
import { Cover, Ladder, Ring } from '../GarauCircleViews';
import DiskFrame from '../DiskFrame';

type View = 'ladder' | 'circle' | 'cover';

const VIEWS: ReadonlyArray<readonly [View, string]> = [
  ['ladder', 'Ladder'],
  ['circle', 'Circle'],
  ['cover', 'As on the cover'],
];

export default function GarauCircleFigure() {
  const [view, setView] = useState<View>('ladder');
  return (
    <DiskFrame className="space-y-4">
      <div className="flex justify-center gap-1">
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-xs px-3 py-1.5 text-sm ${view === v ? 'bg-ink text-paper' : 'text-ink/75 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'ladder' && <Ladder />}
      {view === 'circle' && <Ring />}
      {view === 'cover' && <Cover />}
    </DiskFrame>
  );
}
