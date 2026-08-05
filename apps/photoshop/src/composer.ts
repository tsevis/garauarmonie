/**
 * The Composer tab — Metelli's four-zone transparency tool. A thin client of
 * @garau/engine (the exact package the web studio uses).
 *
 * Forward mode: backgrounds A, B + veil t + α → overlaps P, Q. Inverse mode:
 * A, B + sampled overlaps P, Q → recovered veil t + α. Colors are pulled from
 * and pushed to the Photoshop document via psBridge.
 */
import type { RGB } from '@garau/engine';
import {
  computeForward,
  computeInverse,
  validateTransparency,
  classifyJuxtaposition,
  suggestTransparentColor,
  analyzeVisualMixture,
  rgbToHex,
  hexToRgb,
} from '@garau/engine';
import { inPhotoshop, getForegroundRGB, setForegroundRGB, fillWithRGB } from './psBridge';
import { css, el } from './dom';

type Mode = 'forward' | 'inverse';

const state = {
  mode: 'forward' as Mode,
  A: { r: 221, g: 20, b: 66 } as RGB,
  B: { r: 11, g: 160, b: 228 } as RGB,
  t: { r: 243, g: 113, b: 114 } as RGB,
  alpha: 0.625,
  P: { r: 229, g: 55, b: 84 } as RGB,
  Q: { r: 98, g: 142, b: 185 } as RGB,
};

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

/** A read-only computed color with push-to-document actions. */
function outputRow(label: string, get: () => RGB): { row: HTMLElement; update: () => void } {
  const swatch = el('div', { class: 'swatch' });
  const hex = el('span', { class: 'hex' });
  const notation = el('span', { class: 'badge' });
  const setFg = el('button', { class: 'mini' }, '→ FG');
  const fill = el('button', { class: 'mini' }, 'Fill');
  setFg.addEventListener('click', () => guarded(() => setForegroundRGB(get()), `Foreground set to ${rgbToHex(get())}`));
  fill.addEventListener('click', () => guarded(() => fillWithRGB(get()), `Filled with ${rgbToHex(get())}`));

  const row = el(
    'div',
    { class: 'row output' },
    swatch,
    el('div', { class: 'meta' }, el('div', { class: 'label' }, label, notation), hex),
    el('div', { class: 'actions' }, setFg, fill),
  );
  const update = () => {
    const c = get();
    swatch.style.backgroundColor = css(c);
    hex.textContent = rgbToHex(c);
    notation.textContent = analyzeVisualMixture(c).notation;
  };
  return { row, update };
}

/** An editable color input with a "pull from foreground" button. */
function inputRow(label: string, key: 'A' | 'B' | 't' | 'P' | 'Q', onChange: () => void): HTMLElement {
  const swatch = el('div', { class: 'swatch' });
  const hex = el('input', { class: 'hexinput', type: 'text', spellcheck: 'false' }) as HTMLInputElement;
  const pull = el('button', { class: 'mini' }, 'FG');

  const sync = () => {
    const c = state[key] as RGB;
    swatch.style.backgroundColor = css(c);
    hex.value = rgbToHex(c);
  };
  hex.addEventListener('change', () => {
    const v = hex.value.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(v) || /^#?[0-9a-fA-F]{3}$/.test(v)) {
      (state[key] as RGB) = hexToRgb(v);
      sync();
      onChange();
    }
  });
  pull.addEventListener('click', () =>
    guarded(async () => {
      (state[key] as RGB) = getForegroundRGB();
      sync();
      onChange();
    }, `${label} set from foreground`),
  );

  sync();
  return el(
    'div',
    { class: 'row input' },
    swatch,
    el('div', { class: 'meta' }, el('div', { class: 'label' }, label), hex),
    el('div', { class: 'actions' }, pull),
  );
}

export function renderComposer(root: HTMLElement) {
  root.textContent = '';

  root.appendChild(
    el('p', { class: 'subtitle' }, inPhotoshop() ? 'Perceptual color transparency' : 'Preview — open in Photoshop for document actions'),
  );

  // Mode toggle
  const toggle = el('div', { class: 'toggle' });
  (['forward', 'inverse'] as Mode[]).forEach((m) => {
    const b = el('button', { class: state.mode === m ? 'on' : '' }, m[0]!.toUpperCase() + m.slice(1));
    b.addEventListener('click', () => {
      state.mode = m;
      renderComposer(root);
    });
    toggle.appendChild(b);
  });
  root.appendChild(toggle);

  const outputs: (() => void)[] = [];
  const rerender = () => {
    if (state.mode === 'forward') {
      const r = computeForward(state.A, state.B, state.t, state.alpha);
      state.P = r.P;
      state.Q = r.Q;
    } else {
      const r = computeInverse(state.A, state.B, state.P, state.Q);
      state.t = r.t;
      state.alpha = r.alpha;
    }
    outputs.forEach((u) => u());
    updateStatusPanel();
  };

  // Inputs
  const inputs = el('div', { class: 'section' });
  inputs.appendChild(inputRow('A · background 1', 'A', rerender));
  inputs.appendChild(inputRow('B · background 2', 'B', rerender));
  if (state.mode === 'forward') {
    inputs.appendChild(inputRow('t · veil', 't', rerender));

    const alphaWrap = el('div', { class: 'alpha' });
    const alphaLabel = el('span', {}, `α  ${(state.alpha * 100).toFixed(0)}%`);
    const slider = el('input', { type: 'range', min: '0', max: '1', step: '0.01', value: String(state.alpha) }) as HTMLInputElement;
    slider.addEventListener('input', () => {
      state.alpha = Number(slider.value);
      alphaLabel.textContent = `α  ${(state.alpha * 100).toFixed(0)}%`;
      rerender();
    });
    alphaWrap.appendChild(alphaLabel);
    alphaWrap.appendChild(slider);
    inputs.appendChild(alphaWrap);

    const auto = el('button', { class: 'wide' }, 'Auto-suggest veil');
    auto.addEventListener('click', () => {
      const s = suggestTransparentColor(state.A, state.B)[0];
      if (s) {
        state.t = s;
        renderComposer(root);
      }
    });
    inputs.appendChild(auto);
  } else {
    inputs.appendChild(inputRow('P · overlap over A', 'P', rerender));
    inputs.appendChild(inputRow('Q · overlap over B', 'Q', rerender));
  }
  root.appendChild(inputs);

  // Outputs
  const out = el('div', { class: 'section outputs' });
  if (state.mode === 'forward') {
    const p = outputRow('P · over A', () => state.P);
    const q = outputRow('Q · over B', () => state.Q);
    out.appendChild(p.row);
    out.appendChild(q.row);
    outputs.push(p.update, q.update);
  } else {
    const tOut = outputRow('t · veil', () => state.t);
    out.appendChild(tOut.row);
    outputs.push(tOut.update);
  }
  root.appendChild(out);

  // Status panel (validity / quality / juxtaposition)
  const panel = el('div', { class: 'statuspanel' });
  root.appendChild(panel);

  function updateStatusPanel() {
    const report = validateTransparency(state.A, state.B, state.P, state.Q, state.t, state.alpha);
    const jt = classifyJuxtaposition(state.P, state.Q);
    panel.textContent = '';
    panel.appendChild(
      el(
        'div',
        { class: `verdict ${report.overallValid ? 'valid' : 'invalid'}` },
        report.overallValid ? '✓ Valid transparency' : '✗ Not yet valid',
      ),
    );
    panel.appendChild(el('div', { class: 'metric' }, `Quality  ${report.transparencyQuality.toFixed(0)}/100`));
    panel.appendChild(el('div', { class: 'metric' }, `Type  ${jt.type}`));
    if (state.mode === 'inverse') {
      panel.appendChild(el('div', { class: 'metric' }, `Recovered α  ${(state.alpha * 100).toFixed(0)}%`));
    }
  }

  statusEl = el('div', { class: 'status info' }, inPhotoshop() ? 'Ready.' : 'Preview mode.');
  root.appendChild(statusEl);

  rerender();
}
