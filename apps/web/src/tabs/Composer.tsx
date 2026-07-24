import { useEffect, useMemo, useRef, useState } from 'react';
import type { RGB, TransparencyConfig } from '@garau/engine';
import {
  computeForward,
  computeInverse,
  validateTransparency,
  classifyJuxtaposition,
  suggestTransparentColor,
  rgbToHex,
} from '@garau/engine';
import { downloadPng, downloadSvg } from '../lib/exportImage';

export interface LoadedConfig {
  config: TransparencyConfig;
  nonce: number;
}
import ColorField from '../components/ColorField';
import AlphaSlider from '../components/AlphaSlider';
import FourZoneDisplay, { type Zone } from '../components/FourZoneDisplay';
import ValidityDashboard from '../components/ValidityDashboard';
import SwatchReadout from '../components/SwatchReadout';

type Mode = 'forward' | 'inverse';

// A compelling shared-subordinate example (quality ≈ 93/100), found by
// searching the engine — so the studio opens on a genuinely valid transparency.
const seed = {
  A: { r: 221, g: 20, b: 66 } as RGB, // crimson
  B: { r: 11, g: 160, b: 228 } as RGB, // sky blue
  t: { r: 243, g: 113, b: 114 } as RGB, // coral veil
  alpha: 0.625,
  P: { r: 229, g: 55, b: 84 } as RGB, // veil over crimson
  Q: { r: 98, g: 142, b: 185 } as RGB, // veil over blue
};

function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-line bg-panel px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}

interface Props {
  loaded?: LoadedConfig | null;
  onSave?: (config: TransparencyConfig) => void;
}

export default function Composer({ loaded, onSave }: Props) {
  const [mode, setMode] = useState<Mode>('forward');
  const [A, setA] = useState<RGB>(seed.A);
  const [B, setB] = useState<RGB>(seed.B);
  const [t, setT] = useState<RGB>(seed.t);
  const [alpha, setAlpha] = useState<number>(seed.alpha);
  const [Pin, setPin] = useState<RGB>(seed.P);
  const [Qin, setQin] = useState<RGB>(seed.Q);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  // Load a preset/saved display from the Gallery (nonce ensures repeat loads apply).
  useEffect(() => {
    if (!loaded) return;
    setMode('forward');
    setA(loaded.config.A);
    setB(loaded.config.B);
    setT(loaded.config.t);
    setAlpha(loaded.config.alpha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.nonce]);

  // Run the engine in the active direction.
  const result = useMemo(() => {
    if (mode === 'forward') {
      const r = computeForward(A, B, t, alpha);
      return { P: r.P, Q: r.Q, t, alpha };
    }
    const r = computeInverse(A, B, Pin, Qin);
    return { P: Pin, Q: Qin, t: r.t, alpha: r.alpha };
  }, [mode, A, B, t, alpha, Pin, Qin]);

  const report = useMemo(
    () => validateTransparency(A, B, result.P, result.Q, result.t, result.alpha),
    [A, B, result],
  );
  const juxtaposition = useMemo(() => classifyJuxtaposition(result.P, result.Q), [result]);

  const randomChannel = () => Math.floor(Math.random() * 256);
  const randomColor = (): RGB => ({ r: randomChannel(), g: randomChannel(), b: randomChannel() });

  const randomize = () => {
    setMode('forward');
    setA(randomColor());
    setB(randomColor());
    setT(randomColor());
    setAlpha(0.25 + Math.random() * 0.45);
  };

  const autoSuggestT = () => {
    const suggestions = suggestTransparentColor(A, B);
    if (suggestions[0]) setT(suggestions[0]);
  };

  const swap = () => {
    setA(B);
    setB(A);
  };

  const handleSave = () => {
    onSave?.({ A, B, t: result.t, alpha: result.alpha });
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1600);
  };

  const exportBase = () =>
    `garau-${rgbToHex(A).slice(1)}-${rgbToHex(B).slice(1)}-a${Math.round(result.alpha * 100)}`;
  const displaySvg = () => displayRef.current?.querySelector('svg') ?? null;
  const exportPng = () => {
    const svg = displaySvg();
    if (svg) void downloadPng(svg, `${exportBase()}.png`);
  };
  const exportSvg = () => {
    const svg = displaySvg();
    if (svg) downloadSvg(svg, `${exportBase()}.svg`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* LEFT — inputs */}
      <section className="space-y-5">
        <div className="flex overflow-hidden rounded-sm border border-line">
          {(['forward', 'inverse'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                mode === m ? 'bg-ink text-paper' : 'bg-panel text-muted hover:text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          {mode === 'forward'
            ? 'Given the two backgrounds, the veil color t and its transparency α, the overlaps P and Q are computed.'
            : 'Given the two backgrounds and the two overlaps P and Q, the veil color t and transparency α are recovered.'}
        </p>

        <ColorField label="A" sublabel="background 1" value={A} onChange={setA} showMixture />
        <ColorField label="B" sublabel="background 2" value={B} onChange={setB} showMixture />

        {mode === 'forward' ? (
          <>
            <ColorField label="t" sublabel="veil color" value={t} onChange={setT} showMixture />
            <AlphaSlider value={alpha} onChange={setAlpha} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={autoSuggestT}>Auto-suggest t</Button>
              <Button onClick={swap}>Swap A↔B</Button>
              <Button onClick={randomize}>Randomize</Button>
              {onSave && <Button onClick={handleSave}>{justSaved ? 'Saved ✓' : 'Save'}</Button>}
            </div>
          </>
        ) : (
          <>
            <ColorField label="P" sublabel="overlap over A" value={Pin} onChange={setPin} showMixture />
            <ColorField label="Q" sublabel="overlap over B" value={Qin} onChange={setQin} showMixture />
            <div className="flex flex-wrap gap-2">
              <Button onClick={swap}>Swap A↔B</Button>
              {onSave && <Button onClick={handleSave}>{justSaved ? 'Saved ✓' : 'Save'}</Button>}
            </div>
          </>
        )}
      </section>

      {/* CENTER — display */}
      <section className="space-y-5">
        <div ref={displayRef} className="rounded-md border border-line bg-panel p-5">
          <FourZoneDisplay
            A={A}
            B={B}
            P={result.P}
            Q={result.Q}
            selectedZone={selectedZone}
            onZoneClick={(z) => setSelectedZone((cur) => (cur === z ? null : z))}
          />
          <div className="mt-4 flex justify-center gap-2 border-t border-line pt-4">
            <Button onClick={exportPng}>Export PNG</Button>
            <Button onClick={exportSvg}>Export SVG</Button>
          </div>
        </div>

        {/* Quality + juxtaposition */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-panel p-4">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Transparency quality</span>
              <span className="font-mono text-sm text-ink">{report.transparencyQuality.toFixed(0)}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${report.transparencyQuality}%`,
                  backgroundColor: report.transparencyQuality > 66 ? '#4E7A51' : report.transparencyQuality > 40 ? '#B0873E' : '#B4534B',
                }}
              />
            </div>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Juxtaposition</div>
            <div className="mt-1 text-sm font-semibold text-ink">{juxtaposition.type}</div>
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: juxtaposition.harmony === 'Balanced concord' ? '#E5EEE4' : juxtaposition.harmony === 'Unbalanced discord' ? '#F3E2E0' : '#ECE9E4',
                color: juxtaposition.harmony === 'Balanced concord' ? '#33552F' : juxtaposition.harmony === 'Unbalanced discord' ? '#7A3A34' : '#5A554E',
              }}
            >
              {juxtaposition.harmony}
            </span>
          </div>
        </div>

        {juxtaposition.description && (
          <p className="rounded-md border border-line bg-panel p-4 text-sm leading-relaxed text-muted">
            {juxtaposition.description}
          </p>
        )}
      </section>

      {/* RIGHT — results & validity */}
      <section className="space-y-5">
        <div className="space-y-3 rounded-md border border-line bg-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Zones</h3>
          <SwatchReadout label="A" color={A} />
          <SwatchReadout label="B" color={B} />
          <SwatchReadout label="P" color={result.P} emphasis />
          <SwatchReadout label="Q" color={result.Q} emphasis />
          <div className="border-t border-line pt-3">
            <SwatchReadout label="t" color={result.t} emphasis />
            <div className="mt-2 font-mono text-xs text-muted">
              α = {result.alpha.toFixed(3)} ({(result.alpha * 100).toFixed(0)}%)
            </div>
          </div>
        </div>

        <div className="rounded-md border border-line bg-panel p-4">
          <ValidityDashboard report={report} />
        </div>

        {report.suggestions.length > 0 && (
          <div className="rounded-md border border-line bg-panel p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Suggestions</h3>
            <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
              {report.suggestions.slice(0, 4).map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-accent">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
