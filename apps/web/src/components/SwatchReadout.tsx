import type { RGB } from '@garau/engine';
import { rgbToCss, contrastText, colorReadout } from '../lib/color';

interface Props {
  label: string;
  color: RGB;
  emphasis?: boolean;
}

/** A borderless color chip with hex/RGB/HSL readout. Click hex to copy. */
export default function SwatchReadout({ label, color, emphasis }: Props) {
  const r = colorReadout(color);
  return (
    <div className="flex items-center gap-3">
      <div
        className="swatch flex h-12 w-12 shrink-0 items-center justify-center font-mono text-sm font-bold"
        style={{ backgroundColor: rgbToCss(color), color: contrastText(color) }}
      >
        {label}
      </div>
      <div className="min-w-0 leading-tight">
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(r.hex)}
          className={`font-mono ${emphasis ? 'text-sm font-semibold' : 'text-sm'} text-ink hover:text-accent`}
          title="Copy hex"
        >
          {r.hex}
        </button>
        <div className="font-mono text-[11px] text-muted">
          rgb {r.rgb} · hsl {r.hsl}
        </div>
      </div>
    </div>
  );
}
