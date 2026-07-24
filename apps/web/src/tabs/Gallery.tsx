import { useState } from 'react';
import type { TransparencyConfig } from '@garau/engine';
import PresetThumb from '../components/PresetThumb';
import {
  STUDIES,
  BY_TYPE,
  BY_DEGREE,
  presetToConfig,
  type Preset,
} from '../lib/presets';

type View = 'type' | 'degree' | 'studies' | 'saved';

const JT_BADGE: Record<string, string> = {
  'Shared Subordinate': '#4E7A51',
  'Shared Dominant': '#3F6DA6',
  'Complete Inversion': '#B0873E',
  'Partial Inversion': '#B4534B',
};

interface CardProps {
  preset: Preset;
  onLoad: (config: TransparencyConfig) => void;
  onRemove?: (id: string) => void;
}

function PresetCard({ preset, onLoad, onRemove }: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-line bg-panel transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onLoad(presetToConfig(preset))}
        className="block w-full text-left"
        title="Load into the Composer"
      >
        <div className="aspect-[16/11] overflow-hidden bg-line">
          <PresetThumb {...presetToConfig(preset)} />
        </div>
        <div className="space-y-1.5 p-3">
          <div className="text-sm font-medium leading-tight text-ink">{preset.name}</div>
          <div className="flex items-center justify-between">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: JT_BADGE[preset.jt] ?? '#6B6660' }}
            >
              {preset.jt}
            </span>
            <span className="font-mono text-[11px] text-muted">{preset.quality}/100</span>
          </div>
        </div>
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <span className="rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-paper">Load into Composer →</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(preset.id)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-paper opacity-0 transition-opacity hover:bg-ink group-hover:opacity-100"
          title="Remove from saved"
        >
          ×
        </button>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

interface Props {
  onLoad: (config: TransparencyConfig) => void;
  saved: Preset[];
  onRemove: (id: string) => void;
}

export default function Gallery({ onLoad, saved, onRemove }: Props) {
  const [view, setView] = useState<View>('type');

  const VIEWS: { id: View; label: string }[] = [
    { id: 'type', label: 'By juxtaposition' },
    { id: 'degree', label: 'By degree' },
    { id: 'studies', label: 'Studies' },
    { id: 'saved', label: `Saved${saved.length ? ` (${saved.length})` : ''}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap overflow-hidden rounded-sm border border-line">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === v.id ? 'bg-ink text-paper' : 'bg-panel text-muted hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Click any display to load it into the Composer.</p>
      </div>

      {view === 'type' &&
        (Object.keys(BY_TYPE) as (keyof typeof BY_TYPE)[]).map((jt) => (
          <section key={jt} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h3 className="text-sm font-semibold text-ink">{jt}</h3>
              <span className="h-px flex-1 bg-line" />
            </div>
            <Grid>
              {BY_TYPE[jt].map((p) => (
                <PresetCard key={p.id} preset={p} onLoad={onLoad} />
              ))}
            </Grid>
          </section>
        ))}

      {view === 'degree' &&
        BY_DEGREE.map((group) => (
          <section key={group.key} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
              <p className="mt-0.5 text-xs text-muted">{group.blurb}</p>
            </div>
            <Grid>
              {group.presets.map((p) => (
                <PresetCard key={p.id} preset={p} onLoad={onLoad} />
              ))}
            </Grid>
          </section>
        ))}

      {view === 'studies' && (
        <section className="space-y-3">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Original compositions in Garau’s spirit — each a valid, balanced transparency. (Not
            reproductions of specific book plates.)
          </p>
          <Grid>
            {STUDIES.map((p) => (
              <PresetCard key={p.id} preset={p} onLoad={onLoad} />
            ))}
          </Grid>
        </section>
      )}

      {view === 'saved' &&
        (saved.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            No saved displays yet. In the Composer, build a transparency and press
            <span className="mx-1 rounded-sm border border-line bg-panel px-1.5 py-0.5 font-mono text-xs">Save</span>
            to keep it here.
          </div>
        ) : (
          <Grid>
            {saved.map((p) => (
              <PresetCard key={p.id} preset={p} onLoad={onLoad} onRemove={onRemove} />
            ))}
          </Grid>
        ))}
    </div>
  );
}
