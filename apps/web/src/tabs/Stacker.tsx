import { useMemo, useRef, useState } from 'react';
import type { RGB, TransparencyConfig } from '@garau/engine';
import {
  compositeVeil,
  validateTransparency,
  classifyJuxtaposition,
  pairLabel,
  suggestTransparentColor,
  rgbToHex,
  hexToRgb,
} from '@garau/engine';
import ColorField from '../components/ColorField';
import StackDisplay, { type VeilLayer } from '../components/StackDisplay';
import { rgbToCss, contrastText } from '../lib/color';
import { garau } from '../lib/garauColour';

const MAX_LAYERS = 5;

const HARMONY_BADGE: Record<string, { bg: string; fg: string }> = {
  'Balanced concord': { bg: '#E5EEE4', fg: '#33552F' },
  'Unbalanced discord': { bg: '#F3E2E0', fg: '#7A3A34' },
  Neutral: { bg: '#ECE9E4', fg: '#5A554E' },
};

// A searched default in the colours of Garau's circle whose three planes walk
// his sequence, each a valid transparency over the plane beneath:
// Complete Inversion → Shared Subordinate → Shared Dominant. Base: B and bR.
const g = garau;
const seedA: RGB = g('B');
const seedB: RGB = g('bR');
const seedLayers: VeilLayer[] = [
  { id: 'l0', t: g('BR'), alpha: 0.45 }, // violet → Complete Inversion
  { id: 'l1', t: g('YB'), alpha: 0.8 }, // green → Shared Subordinate
  { id: 'l2', t: g('Y'), alpha: 0.85 }, // yellow → Shared Dominant
];

interface Props {
  onLoad: (config: TransparencyConfig) => void;
}

export default function Stacker({ onLoad }: Props) {
  const [A, setA] = useState<RGB>(seedA);
  const [B, setB] = useState<RGB>(seedB);
  const [layers, setLayers] = useState<VeilLayer[]>(seedLayers);
  const [depth, setDepth] = useState(0.55);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nextId = useRef(seedLayers.length);

  // Composite each plane over the accumulated result of the planes beneath it.
  const rows = useMemo(() => {
    let colA = A;
    let colB = B;
    return layers.map((layer) => {
      const prevA = colA;
      const prevB = colB;
      const newA = compositeVeil(prevA, layer.t, layer.alpha);
      const newB = compositeVeil(prevB, layer.t, layer.alpha);
      const report = validateTransparency(prevA, prevB, newA, newB, layer.t, layer.alpha);
      const jux = classifyJuxtaposition(newA, newB);
      colA = newA;
      colB = newB;
      return { layer, prevA, prevB, newA, newB, report, jux };
    });
  }, [A, B, layers]);

  const finalA = rows.length ? rows[rows.length - 1]!.newA : A;
  const finalB = rows.length ? rows[rows.length - 1]!.newB : B;

  const updateLayer = (id: string, patch: Partial<VeilLayer>) =>
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLayer = (id: string) => setLayers((cur) => cur.filter((l) => l.id !== id));
  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return;
    const suggestion = suggestTransparentColor(finalA, finalB)[0] ?? { r: 220, g: 220, b: 220 };
    const id = `l${nextId.current++}`;
    setLayers((cur) => [...cur, { id, t: suggestion, alpha: 0.5 }]);
    setSelectedId(id);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* LEFT — base + veils */}
      <section className="space-y-5">
        <p className="text-xs leading-relaxed text-muted">
          Stack transparent veils into ordered depth planes. Each plane is composited over the result of
          the planes beneath it, and validated as a transparency against them.
        </p>

        <ColorField label="A" sublabel="background 1" value={A} onChange={setA} showMixture />
        <ColorField label="B" sublabel="background 2" value={B} onChange={setB} showMixture />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Veils</h3>
            <button
              type="button"
              onClick={addLayer}
              disabled={layers.length >= MAX_LAYERS}
              className="rounded-xs border border-line bg-panel px-2 py-1 text-xs font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-40"
            >
              + Add veil
            </button>
          </div>

          {layers.map((layer, i) => {
            const hex = rgbToHex(layer.t);
            const selected = layer.id === selectedId;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedId(selected ? null : layer.id)}
                className={`cursor-pointer rounded-md border p-3 transition-colors ${selected ? 'border-accent bg-panel' : 'border-line bg-panel/60'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Plane {i + 1}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    className="text-muted hover:text-ink"
                    title="Remove veil"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="swatch h-8 w-8 shrink-0" style={{ backgroundColor: rgbToCss(layer.t) }} />
                  <input
                    type="text"
                    value={hex}
                    spellCheck={false}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (/^#?[0-9a-fA-F]{6}$/.test(v)) updateLayer(layer.id, { t: hexToRgb(v) });
                    }}
                    className="w-full rounded-xs border border-line bg-panel px-2 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-hidden"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted">α</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={layer.alpha}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateLayer(layer.id, { alpha: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-8 text-right font-mono text-[10px] text-ink">{(layer.alpha * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Depth separation</label>
            <span className="font-mono text-xs text-ink">{(depth * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full" />
        </div>
      </section>

      {/* CENTER — stacked display */}
      <section className="space-y-4">
        <div className="rounded-md border border-line bg-panel p-5">
          <StackDisplay
            A={A}
            B={B}
            layers={layers}
            planes={rows.map((r) => ({ overA: r.newA, overB: r.newB }))}
            depth={depth}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="mt-3 text-center text-xs text-muted">
            Nested planes recede in depth. Click a plane to select it. Each plane is drawn in the colours the
            engine computes — Metelli’s average in linear light over everything beneath.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-md border border-line bg-panel p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Deepest region</span>
          <div className="flex items-center gap-2">
            <span className="swatch h-8 w-8" style={{ backgroundColor: rgbToCss(finalA), color: contrastText(finalA) }} />
            <span className="font-mono text-xs text-ink">{rgbToHex(finalA)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="swatch h-8 w-8" style={{ backgroundColor: rgbToCss(finalB), color: contrastText(finalB) }} />
            <span className="font-mono text-xs text-ink">{rgbToHex(finalB)}</span>
          </div>
        </div>
      </section>

      {/* RIGHT — per-plane analysis */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Planes, front to back</h3>
        {rows.length === 0 && <p className="text-sm text-muted">Add a veil to begin stacking.</p>}
        {rows.map(({ layer, prevA, prevB, newA, newB, report, jux }, i) => {
          const badge = HARMONY_BADGE[jux.harmony] ?? HARMONY_BADGE.Neutral!;
          const selected = layer.id === selectedId;
          return (
            <div
              key={layer.id}
              onClick={() => setSelectedId(selected ? null : layer.id)}
              className={`cursor-pointer rounded-md border p-4 ${selected ? 'border-accent' : 'border-line'} bg-panel`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Plane {i + 1}</span>
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: report.overallValid ? '#4E7A51' : '#B4534B' }}
                  title={report.overallValid ? 'Valid transparency over the plane beneath' : 'Not a valid transparency over the plane beneath'}
                />
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[prevA, prevB, newA, newB].map((c, k) => (
                  <span key={k} className="h-6 flex-1 rounded-xs" style={{ backgroundColor: rgbToCss(c) }} title={rgbToHex(c)} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">{pairLabel(jux)}</span>
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.fg }}>
                  {jux.harmony}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoad({ A: prevA, B: prevB, t: layer.t, alpha: layer.alpha });
                }}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Open this plane in the Composer →
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
