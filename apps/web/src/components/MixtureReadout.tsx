import type { RGB } from '@garau/engine';
import { analyzeVisualMixture, getComplementaryMixture, findSharedSubordinatePartner } from '@garau/engine';
import { rgbToCss, contrastText } from '../lib/color';
import { PRIMARY_NAME, describeMixture, mixtureType } from '../lib/garau';

const TYPE_COLOR: Record<string, string> = {
  Pure: '#6B6660',
  Balanced: '#B0873E',
  Unbalanced: '#4E7A51',
};

function Meter({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export default function MixtureReadout({ color, onPick }: { color: RGB; onPick?: (c: RGB) => void }) {
  const m = analyzeVisualMixture(color);
  const type = mixtureType(m);
  const complement = getComplementaryMixture(color);
  const partner = findSharedSubordinatePartner(color);

  // Proportion of dominant vs subordinate (ratio = subordinate contribution).
  const subShare = m.subordinate ? Math.round(m.ratio * 100) : 0;
  const domShare = 100 - subShare;

  const PartnerSwatch = ({ label, c, hint }: { label: string; c: RGB; hint: string }) => (
    <button
      type="button"
      onClick={() => onPick?.(c)}
      className="group flex items-center gap-2 text-left"
      title={onPick ? `${hint} — click to analyze` : hint}
    >
      <span className="swatch h-9 w-9 shrink-0" style={{ backgroundColor: rgbToCss(c) }} />
      <span className="text-xs leading-tight text-muted group-hover:text-ink">{label}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span
          className="swatch flex h-14 w-14 items-center justify-center font-mono text-lg font-bold"
          style={{ backgroundColor: rgbToCss(color), color: contrastText(color) }}
        >
          {m.notation}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">Garau notation {m.notation}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: TYPE_COLOR[type] }}
            >
              {type}
            </span>
          </div>
          <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-muted">{describeMixture(m)}</p>
        </div>
      </div>

      {/* Dominant / subordinate proportion */}
      <div>
        <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>Dominant · {PRIMARY_NAME[m.dominant]}</span>
          {m.subordinate && <span>Subordinate · {PRIMARY_NAME[m.subordinate]}</span>}
        </div>
        <div className="flex h-6 overflow-hidden rounded-sm">
          <div className="flex items-center justify-center font-mono text-[11px] text-white" style={{ width: `${domShare}%`, backgroundColor: '#3A3733' }}>
            {domShare}%
          </div>
          {subShare > 0 && (
            <div className="flex items-center justify-center font-mono text-[11px] text-white" style={{ width: `${subShare}%`, backgroundColor: '#9A938A' }}>
              {subShare}%
            </div>
          )}
        </div>
      </div>

      {/* Splittability */}
      <div>
        <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>Splittability</span>
          <span className="font-mono text-ink">{Math.round(m.splittability * 100)}%</span>
        </div>
        <Meter value={m.splittability} />
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          How readily the eye separates this color into its components — the basis of perceived transparency.
        </p>
      </div>

      {/* Garau partners */}
      <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
        <PartnerSwatch label="Complementary mixture" c={complement} hint="Same subordinate, opposite hue" />
        <PartnerSwatch label="Shared-subordinate partner" c={partner} hint="Pairs into a very transparent display" />
      </div>
    </div>
  );
}
