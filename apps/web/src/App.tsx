import { useState } from 'react';
import type { TransparencyConfig } from '@garau/engine';
import { computeForward, validateTransparency, rgbToHex } from '@garau/engine';
import Composer, { type LoadedConfig } from './tabs/Composer';
import Stacker from './tabs/Stacker';
import Analyzer from './tabs/Analyzer';
import Gallery from './tabs/Gallery';
import Theory from './tabs/Theory';
import { useSavedPresets } from './lib/savedStore';
import type { Preset } from './lib/presets';

type TabId = 'composer' | 'stacker' | 'analyzer' | 'gallery' | 'theory';

const TABS: { id: TabId; label: string }[] = [
  { id: 'composer', label: 'Composer' },
  { id: 'stacker', label: 'Stacker' },
  { id: 'analyzer', label: 'Analyzer' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'theory', label: 'Theory' },
];

/** Build a persistable Preset from a live Composer configuration. */
function configToPreset(config: TransparencyConfig): Preset {
  const { P, Q } = computeForward(config.A, config.B, config.t, config.alpha);
  const report = validateTransparency(config.A, config.B, P, Q, config.t, config.alpha);
  const id = `saved-${Date.now()}`;
  return {
    id,
    name: `${rgbToHex(config.A)} · ${rgbToHex(config.B)} · veil ${rgbToHex(config.t)}`,
    A: rgbToHex(config.A),
    B: rgbToHex(config.B),
    t: rgbToHex(config.t),
    alpha: config.alpha,
    jt: report.juxtapositionType ?? 'Partial Inversion',
    quality: Math.round(report.transparencyQuality),
  };
}

export default function App() {
  const [tab, setTab] = useState<TabId>('composer');
  const [loaded, setLoaded] = useState<LoadedConfig | null>(null);
  const { saved, save, remove } = useSavedPresets();

  const loadIntoComposer = (config: TransparencyConfig) => {
    setLoaded({ config, nonce: Date.now() });
    setTab('composer');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Garau Armonie</h1>
            <p className="text-xs text-muted">
              A studio for perceptual color transparency · in memory of Augusto Garau (1923–2010)
            </p>
          </div>
          <nav className="flex gap-1">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === tb.id ? 'bg-ink text-paper' : 'text-muted hover:bg-line/60 hover:text-ink'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === 'composer' && <Composer loaded={loaded} onSave={(config) => save(configToPreset(config))} />}
        {tab === 'stacker' && <Stacker onLoad={loadIntoComposer} />}
        {tab === 'analyzer' && <Analyzer />}
        {tab === 'gallery' && <Gallery onLoad={loadIntoComposer} saved={saved} onRemove={remove} />}
        {tab === 'theory' && <Theory />}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-4 text-xs text-muted">
        Powered by <span className="font-mono">@garau/engine</span> — the same color engine will drive
        the planned Photoshop plugin.
      </footer>
    </div>
  );
}
