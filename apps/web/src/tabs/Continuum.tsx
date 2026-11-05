import { useEffect, useMemo, useState } from 'react';
import type { ContinuumSolution, DominantPrimary } from '@garau/engine';
import { GARAU_CIRCLE, explainBorder, solveContinuum } from '@garau/engine';
import ContinuumControls from '../components/ContinuumControls';
import { CONTINUUM_SAMPLE } from '../lib/continuumSample';
import { GARAU_GREY } from '../lib/garauColour';
import { findRegions, paintSvg, parseSvg, regionAt, regionId, svgDataUrl, type ParsedSvg, type Regions } from '../lib/svgRegions';

const HEX: Record<string, string> = Object.fromEntries(GARAU_CIRCLE.map((c) => [c.notation, c.hex]));
const BORDERS_SHOWN = 12;

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-panel p-5 ${className}`}>{children}</div>;
}

interface Loaded {
  parsed: ParsedSvg;
  regions: Regions;
}

const painted = (loaded: Loaded, colours: Readonly<Record<string, string>>, outline?: number) =>
  svgDataUrl(paintSvg(loaded.parsed, (i) => HEX[colours[regionId(i)] ?? ''] ?? GARAU_GREY, outline));

function download(svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'continuum.svg' });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Continuum() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [locks, setLocks] = useState<Record<string, string>>({});
  const [apex, setApex] = useState<{ region: string; primary: DominantPrimary } | null>(null);
  const [continuity, setContinuity] = useState(0.5);
  const [chosen, setChosen] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const load = async (source: string) => {
    try {
      const parsed = parseSvg(source);
      const regions = await findRegions(parsed);
      setLoaded({ parsed, regions });
      [setGroups, setLocks].forEach((set) => set({}));
      setApex(null);
      setSelected(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The SVG could not be read.');
    }
  };

  useEffect(() => {
    void load(CONTINUUM_SAMPLE);
  }, []);

  const solutions: ContinuumSolution[] = useMemo(() => {
    if (!loaded) return [];
    const graph = { regions: loaded.regions.regions, borders: loaded.regions.borders };
    const area = Object.fromEntries(graph.regions.map((r) => [r, groups[r] ?? 'A']));
    return solveContinuum(graph, { groups: area, locks, apex: apex ?? undefined, continuity, count: 5 });
  }, [loaded, groups, locks, apex, continuity]);

  useEffect(() => setChosen(0), [solutions]);

  if (!loaded) {
    return <p className="text-sm text-muted">{error ?? 'Reading the composition…'}</p>;
  }

  const solution = solutions[chosen] ?? solutions[0];
  const colours = solution?.colours ?? {};
  const outline = selected ? Number(selected.slice(1)) : undefined;
  const borders = [...loaded.regions.borders]
    .filter((b) => !selected || b.a === selected || b.b === selected)
    .sort((x, y) => y.length - x.length)
    .slice(0, BORDERS_SHOWN);

  const pick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSelected(regionAt(loaded.regions, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height));
  };
  const setFor = <T,>(set: React.Dispatch<React.SetStateAction<Record<string, T>>>, value: T | null) =>
    set((prev) => {
      const { [selected!]: _, ...rest } = prev;
      return value === null ? rest : { ...rest, [selected!]: value };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Garau's chromatic continuum as a rule for a composition. Bring an SVG of flat shapes; the twelve colours of his
          circle are placed so that borders inside an area bind, borders between areas divide, and a pure colour stands
          only at the apex, above mixtures it can crown. Click a shape to set its area, lock or apex.
        </p>
        <label className="cursor-pointer rounded-xs border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-line/60">
          Open SVG…
          <input
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void file.text().then(load);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {error && <p className="rounded-xs bg-[#F3E2E0] p-3 text-sm text-[#7A3A34]">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-md border border-line p-4" style={{ backgroundColor: GARAU_GREY }}>
            <img
              src={painted(loaded, colours, outline)}
              alt="The composition coloured with Garau's circle"
              className="w-full cursor-crosshair"
              onClick={pick}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {solutions.map((s, i) => (
              <button
                key={JSON.stringify(s.colours)}
                type="button"
                onClick={() => setChosen(i)}
                className={`w-28 rounded-xs border p-1 ${i === chosen ? 'border-ink' : 'border-line'}`}
                style={{ backgroundColor: GARAU_GREY }}
              >
                <img src={painted(loaded, s.colours)} alt={`Proposal ${i + 1}`} className="w-full" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3">
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
              <span>Contrast</span>
              <span>Continuity</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={continuity}
              onChange={(e) => setContinuity(Number(e.target.value))}
              className="w-full"
              aria-label="Contrast to continuity"
            />
            <button
              type="button"
              onClick={() => download(paintSvg(loaded.parsed, (i) => HEX[colours[regionId(i)] ?? ''] ?? GARAU_GREY))}
              className="w-full rounded-xs bg-ink px-3 py-1.5 text-sm font-medium text-paper"
            >
              Export SVG
            </button>
          </Card>

          <Card>
            {selected ? (
              <ContinuumControls
                region={selected}
                area={groups[selected] ?? 'A'}
                lock={locks[selected] ?? null}
                apexPrimary={apex?.region === selected ? apex.primary : null}
                onArea={(a) => setFor(setGroups, a)}
                onLock={(n) => setFor(setLocks, n)}
                onApex={(p) => setApex(p ? { region: selected, primary: p } : null)}
              />
            ) : (
              <p className="text-sm text-muted">Click a shape in the picture to set its area, lock its colour or make it the apex.</p>
            )}
          </Card>

          <Card>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {selected ? `Borders of shape ${selected.slice(1)}` : 'Longest borders'}
            </div>
            <ul className="space-y-1.5 font-mono text-xs text-ink">
              {borders.map((b) => (
                <li key={`${b.a}|${b.b}`} className="flex items-center gap-2">
                  <span className="inline-flex">
                    <span className="h-3 w-3" style={{ backgroundColor: HEX[colours[b.a] ?? ''] }} />
                    <span className="h-3 w-3" style={{ backgroundColor: HEX[colours[b.b] ?? ''] }} />
                  </span>
                  {colours[b.a] && colours[b.b] ? explainBorder(colours[b.a]!, colours[b.b]!) : '—'}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
