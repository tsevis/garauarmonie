import { useMemo, useState } from 'react';
import type { RGB } from '@garau/engine';
import { classifyJuxtaposition } from '@garau/engine';
import ColorField from '../components/ColorField';
import ChromaticDisk from '../components/ChromaticDisk';
import MixtureReadout from '../components/MixtureReadout';

type Mode = 'single' | 'pair';

// How strongly each type reads as a transparency veil (distinct from harmony).
const TRANSPARENCY_HINT: Record<string, string> = {
  'Shared Subordinate': 'The most compelling veil — the shared component reads cleanly as the transparent layer.',
  'Shared Dominant': 'A workable veil, though the shared dominant makes the layer heavier.',
  'Complete Inversion': 'A weaker veil; the two shared colours tend to converge.',
  'Partial Inversion': 'The hardest to read as a veil — the pair diverges too strongly.',
};

const HARMONY_STYLE: Record<string, { bg: string; fg: string }> = {
  'Balanced concord': { bg: '#E5EEE4', fg: '#33552F' },
  'Unbalanced discord': { bg: '#F3E2E0', fg: '#7A3A34' },
  Neutral: { bg: '#ECE9E4', fg: '#5A554E' },
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-panel p-5 ${className}`}>{children}</div>;
}

export default function Analyzer() {
  const [mode, setMode] = useState<Mode>('single');
  const [color, setColor] = useState<RGB>({ r: 214, g: 92, b: 48 }); // a reddish orange
  const [c1, setC1] = useState<RGB>({ r: 210, g: 120, b: 40 }); // orange
  const [c2, setC2] = useState<RGB>({ r: 60, g: 130, b: 180 }); // blue

  const analysis = useMemo(() => classifyJuxtaposition(c1, c2), [c1, c2]);

  return (
    <div className="space-y-6">
      {/* Mode toggle + intro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-hidden rounded-sm border border-line">
          {(['single', 'pair'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                mode === m ? 'bg-ink text-paper' : 'bg-panel text-muted hover:text-ink'
              }`}
            >
              {m === 'single' ? 'Single color' : 'Color pair'}
            </button>
          ))}
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted">
          {mode === 'single'
            ? 'Any color, read as a visual mixture: dominant + subordinate primaries, its Garau notation, and how readily it splits.'
            : 'Any two colors, classified into one of Arnheim’s four juxtaposition types — which predicts how they behave as a transparency pair.'}
        </p>
      </div>

      {mode === 'single' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="flex flex-col items-center justify-center">
            <ChromaticDisk markers={[{ color, label: '●' }]} onPick={setColor} size={340} />
            <p className="mt-2 text-center text-xs text-muted">
              Click anywhere in the disk to analyze that color. R · Y · B are Garau’s three primaries.
            </p>
          </Card>
          <div className="space-y-5">
            <Card>
              <ColorField label="Color" value={color} onChange={setColor} showMixture />
            </Card>
            <Card>
              <MixtureReadout color={color} onPick={setColor} />
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Card className="space-y-4">
              <ColorField label="Color 1" sublabel="→ P" value={c1} onChange={setC1} showMixture />
              <ColorField label="Color 2" sublabel="→ Q" value={c2} onChange={setC2} showMixture />
            </Card>
            <Card className="flex justify-center">
              <ChromaticDisk
                markers={[
                  { color: c1, label: '1' },
                  { color: c2, label: '2' },
                ]}
                size={280}
              />
            </Card>
          </div>

          <div className="space-y-5">
            {/* Harmony — the primary reading, per Garau's concord/discord grouping */}
            <Card>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Harmony</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor: (HARMONY_STYLE[analysis.harmony] ?? HARMONY_STYLE.Neutral!).bg,
                    color: (HARMONY_STYLE[analysis.harmony] ?? HARMONY_STYLE.Neutral!).fg,
                  }}
                >
                  {analysis.harmony}
                </span>
                <span className="text-sm text-muted">·</span>
                <span className="text-sm font-semibold text-ink">{analysis.type}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{analysis.harmonyNote}</p>
            </Card>

            {/* Transparency reading — a distinct dimension */}
            <Card>
              <div className="flex items-baseline justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">As a transparency</div>
                <div className="font-mono text-lg text-ink">{analysis.transparencyQuality.toFixed(0)}/100</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${analysis.transparencyQuality}%`,
                    backgroundColor: analysis.transparencyQuality > 66 ? '#4E7A51' : analysis.transparencyQuality > 40 ? '#B0873E' : '#B4534B',
                  }}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{TRANSPARENCY_HINT[analysis.type]}</p>
            </Card>

            <Card>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Analysis</h3>
              <p className="text-sm leading-relaxed text-muted">{analysis.description}</p>
              {analysis.recommendedCorrection && (
                <p className="mt-3 rounded-sm bg-paper p-3 text-sm leading-relaxed text-ink">
                  <span className="font-semibold">Correction · </span>
                  {analysis.recommendedCorrection}
                </p>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Color 1 · P</div>
                <MixtureReadout color={c1} />
              </Card>
              <Card>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Color 2 · Q</div>
                <MixtureReadout color={c2} />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
