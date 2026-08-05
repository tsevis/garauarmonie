/**
 * The Library tab — "like Pantone Connect, but far more sophisticated"
 * (`documents/OpenColorSystem-Proposal.md` §2, in the Nino repo): every
 * entry is generated, not hand-picked, and carries its own Garau
 * decomposition and live harmony relationships rather than an opaque code.
 *
 * The bundled `swatches/v1.0.0.json` is the same artifact `@garau/swatches`
 * generates and Nino's `NinoSwatches` module loads — one shared source, three
 * clients (the web studio, Nino, and this panel), exactly the portability
 * Rule #1 asked for.
 */
import { hexToRgb, classifyJuxtaposition } from '@garau/engine';
import type { Swatch, SwatchArtifact } from '@garau/swatches';
import { inPhotoshop, setForegroundRGB, fillWithRGB, addSwatchToPanel } from './psBridge';
import { el } from './dom';

let artifact: SwatchArtifact | null = null;

async function loadArtifact(): Promise<SwatchArtifact> {
  if (artifact) return artifact;
  const res = await fetch('./swatches/v1.0.0.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  artifact = (await res.json()) as SwatchArtifact;
  return artifact;
}

/** Every notation actually present, achromatic ("N") sorted last — Nino's
 * own `availableNotations` ordering, so a designer reading both agrees. */
function availableNotations(swatches: readonly Swatch[]): string[] {
  const seen = new Set<string>();
  for (const s of swatches) seen.add(s.garau?.notation ?? 'N');
  return [...seen].sort((a, b) => {
    if (a === 'N') return 1;
    if (b === 'N') return -1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function filterLibrary(swatches: readonly Swatch[], search: string, notation: string | null): Swatch[] {
  let shown = notation ? swatches.filter((s) => (s.garau?.notation ?? 'N') === notation) : [...swatches];
  const query = search.trim().toLowerCase();
  if (!query) return shown;
  return shown.filter(
    (s) =>
      s.code.toLowerCase().includes(query) ||
      s.name.full.toLowerCase().includes(query) ||
      s.name.aliases.some((a) => a.toLowerCase().includes(query)),
  );
}

/** Every other swatch this one is a concord with — computed live, exactly
 * per the proposal's §5: O(n) over ~1,200 entries from one seed is cheap. */
function concordNeighbours(seed: Swatch, all: readonly Swatch[], limit = 12): Swatch[] {
  const seedRgb = hexToRgb(seed.srgbHex);
  const neighbours: Swatch[] = [];
  for (const candidate of all) {
    if (candidate.code === seed.code) continue;
    if (classifyJuxtaposition(seedRgb, hexToRgb(candidate.srgbHex)).harmony !== 'Balanced concord') continue;
    neighbours.push(candidate);
    if (neighbours.length >= limit) break;
  }
  return neighbours;
}

let statusEl: HTMLElement;
function setStatus(msg: string, kind: 'info' | 'error' | 'ok' = 'info') {
  statusEl.textContent = msg;
  statusEl.className = `status ${kind}`;
}

async function guarded(fn: () => Promise<void>, okMsg: string) {
  if (!inPhotoshop()) {
    setStatus('Not running inside Photoshop.', 'error');
    return;
  }
  try {
    await fn();
    setStatus(okMsg, 'ok');
  } catch (err) {
    setStatus(`Photoshop error: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
}

export async function renderLibrary(root: HTMLElement) {
  root.textContent = '';
  root.appendChild(el('p', { class: 'subtitle' }, 'Loading the Augusto swatch library…'));

  let data: SwatchArtifact;
  try {
    data = await loadArtifact();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    root.textContent = '';
    root.appendChild(
      el(
        'p',
        { class: 'status error' },
        `Could not load the swatch library (${message}). Rebuild the plugin — ` +
          `"npm run build --workspace photoshop" copies swatches/v1.0.0.json alongside dist/.`,
      ),
    );
    return;
  }

  const state = { search: '', notation: null as string | null, selected: null as Swatch | null };
  root.textContent = '';

  const header = el('div', { class: 'section' });
  const search = el('input', { class: 'hexinput', type: 'text', placeholder: 'Search name or code', spellcheck: 'false' }) as HTMLInputElement;
  const notationSelect = el('select', { class: 'hexinput' }) as HTMLSelectElement;
  notationSelect.appendChild(el('option', { value: '' }, 'All notations'));
  for (const n of availableNotations(data.swatches)) notationSelect.appendChild(el('option', { value: n }, n));
  const count = el('div', { class: 'metric' });
  header.append(search, notationSelect, count);
  root.appendChild(header);

  const grid = el('div', { class: 'swatchgrid' });
  root.appendChild(grid);

  const detailHost = el('div', {});
  root.appendChild(detailHost);

  statusEl = el('div', { class: 'status info' }, inPhotoshop() ? 'Ready.' : 'Preview mode.');
  root.appendChild(statusEl);

  function refreshGrid() {
    const filtered = filterLibrary(data.swatches, state.search, state.notation);
    count.textContent = `${filtered.length} of ${data.swatches.length} swatches — Augusto v${data.gridVersion}`;
    grid.textContent = '';
    for (const swatch of filtered) {
      const cell = el('button', { class: 'swatchcell', title: `${swatch.code} · ${swatch.name.full}` });
      cell.style.backgroundColor = `#${swatch.srgbHex.replace(/^#/, '')}`;
      if (state.selected?.code === swatch.code) cell.classList.add('selected');
      cell.addEventListener('click', () => {
        state.selected = swatch;
        refreshGrid();
        refreshDetail();
      });
      grid.appendChild(cell);
    }
  }

  function refreshDetail() {
    detailHost.textContent = '';
    if (!state.selected) return;
    detailHost.appendChild(buildDetail(state.selected, data));
  }

  function buildDetail(swatch: Swatch, artifact: SwatchArtifact): HTMLElement {
    const rgb = hexToRgb(swatch.srgbHex);
    const preview = el('div', { class: 'swatch', style: 'width:100%;height:44px;' });
    preview.style.backgroundColor = `#${swatch.srgbHex.replace(/^#/, '')}`;

    const nameField = el('input', { class: 'hexinput', type: 'text', value: swatch.name.full, spellcheck: 'false' }) as HTMLInputElement;

    const setFg = el('button', { class: 'mini' }, '→ FG');
    setFg.addEventListener('click', () => guarded(() => setForegroundRGB(rgb), `Foreground set to ${swatch.srgbHex}`));
    const fill = el('button', { class: 'mini' }, 'Fill');
    fill.addEventListener('click', () => guarded(() => fillWithRGB(rgb), `Filled with ${swatch.srgbHex}`));
    const add = el('button', { class: 'mini' }, '+ Swatches');
    add.title = 'Adds to the Swatches panel — this specific action is not verified against a running Photoshop; see psBridge.ts.';
    add.addEventListener('click', () =>
      guarded(() => addSwatchToPanel(rgb, nameField.value || swatch.name.full), `Added ${swatch.code} to Swatches`),
    );

    const decomposition = swatch.garau
      ? el(
          'div',
          { class: 'section' },
          el('div', { class: 'metric' }, `Garau  ${swatch.garau.notation}`),
          el(
            'div',
            { class: 'metric' },
            `Composition  ${swatch.garau.dominant}${swatch.garau.subordinate ? ` over ${swatch.garau.subordinate}` : ' alone'}`,
          ),
          el('div', { class: 'metric' }, `Splittability  ${swatch.garau.splittability.toFixed(2)}`),
        )
      : el('div', { class: 'metric' }, 'Achromatic — no dominant primary');

    const neighbourGrid = el('div', { class: 'swatchgrid small' });
    for (const neighbour of concordNeighbours(swatch, artifact.swatches)) {
      const cell = el('button', { class: 'swatchcell', title: `${neighbour.code} · ${neighbour.name.full}` });
      cell.style.backgroundColor = `#${neighbour.srgbHex.replace(/^#/, '')}`;
      cell.addEventListener('click', () => {
        state.selected = neighbour;
        refreshGrid();
        refreshDetail();
      });
      neighbourGrid.appendChild(cell);
    }

    return el(
      'div',
      { class: 'section detail' },
      preview,
      el('div', { class: 'label' }, swatch.code),
      nameField,
      decomposition,
      el('div', { class: 'metric' }, `Hex  ${swatch.srgbHex}`),
      el(
        'div',
        { class: 'metric' },
        `OKLCH  L${swatch.oklch.L.toFixed(2)} C${swatch.oklch.C.toFixed(3)} h${swatch.oklch.h.toFixed(0)}°`,
      ),
      el('div', { class: 'actions' }, setFg, fill, add),
      el('div', { class: 'label' }, 'Concord neighbours'),
      neighbourGrid,
    );
  }

  search.addEventListener('input', () => {
    state.search = search.value;
    refreshGrid();
  });
  notationSelect.addEventListener('change', () => {
    state.notation = notationSelect.value || null;
    refreshGrid();
  });

  refreshGrid();
}
