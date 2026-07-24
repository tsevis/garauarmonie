import { useId } from 'react';
import type { RGB } from '@garau/engine';
import { rgbToHex, hexToRgb, rgb as makeRgb, analyzeVisualMixture } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';

interface Props {
  label: string;
  sublabel?: string;
  value: RGB;
  onChange: (c: RGB) => void;
  /** Show the live Garau mixture notation badge (for backgrounds / t). */
  showMixture?: boolean;
}

/**
 * Full-spectrum color input: a large borderless swatch (native picker),
 * a hex field, and three channel inputs. The swatch carries the most visual
 * weight; chrome stays quiet so it never competes with the color.
 */
export default function ColorField({ label, sublabel, value, onChange, showMixture }: Props) {
  const id = useId();
  const hex = rgbToHex(value);
  const mixture = showMixture ? analyzeVisualMixture(value) : null;

  const setChannel = (key: keyof RGB, raw: string) => {
    const n = Math.max(0, Math.min(255, Number(raw) || 0));
    onChange({ ...value, [key]: n });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {sublabel && <span className="ml-2 font-normal text-muted">{sublabel}</span>}
        </label>
        {mixture && (
          <span
            className="font-mono text-xs px-1.5 py-0.5 rounded-sm"
            style={{ backgroundColor: rgbToCss(value), color: contrastText(value) }}
            title={`Dominant ${mixture.dominant}${mixture.subordinate ? `, subordinate ${mixture.subordinate}` : ' (pure)'}`}
          >
            {mixture.notation}
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        <label
          className="swatch relative w-16 shrink-0 cursor-pointer overflow-hidden"
          style={{ backgroundColor: rgbToCss(value) }}
          title="Open color picker"
        >
          <input
            id={id}
            type="color"
            value={hex}
            onChange={(e) => onChange(hexToRgb(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={hex}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{6}$/.test(v) || /^#?[0-9a-fA-F]{3}$/.test(v)) onChange(hexToRgb(v));
            }}
            spellCheck={false}
            className="w-full rounded-sm border border-line bg-panel px-2 py-1 font-mono text-sm text-ink focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-1.5">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase text-muted">{ch}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={value[ch]}
                  onChange={(e) => setChannel(ch, e.target.value)}
                  className="w-full rounded-sm border border-line bg-panel px-1 py-0.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { makeRgb };
