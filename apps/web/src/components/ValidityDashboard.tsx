import type { ValidationReport } from '@garau/engine';

interface Row {
  label: string;
  state: boolean | null;
  hint: string;
}

function Indicator({ state }: { state: boolean | null }) {
  const color = state === null ? '#B8B2A9' : state ? '#4E7A51' : '#B4534B';
  return <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />;
}

export default function ValidityDashboard({ report }: { report: ValidationReport }) {
  const metelli: Row[] = [
    { label: 'Scission realizable', state: report.scissionRealizable, hint: 'α lies strictly between transparent and opaque (0 < α < 1)' },
    { label: 'Topology preserved', state: report.topologyPreserved, hint: 'Lighter overlap sits over the lighter background' },
    { label: 'Contrast reduction', state: report.contrastReduction, hint: 'Overlap contrast is lower than background contrast — the mark of a veil' },
  ];
  const garau: Row[] = [
    { label: 'Visual mixture · P', state: report.visualMixtureP, hint: '2 · P reads as a chromatic mixture, not a pure primary or a grey' },
    { label: 'Visual mixture · Q', state: report.visualMixtureQ, hint: '2 · Q reads as a chromatic mixture, not a pure primary or a grey' },
    { label: 'Unbalanced preference', state: report.unbalancedPreference, hint: '3 · Unbalanced mixtures (tertiaries) split more readily than secondaries' },
    { label: 'Common color', state: report.commonColorExists, hint: 'P and Q share an RYB component' },
    { label: 'Veil = common color', state: report.veilIsCommonColor, hint: '4 · The colour P and Q share is the veil’s colour (grey: no veil colour, not applicable)' },
    { label: 'Divergent colors', state: report.divergentColorsExist, hint: 'P and Q differ in at least one component' },
    { label: 'Grounds = divergent colors', state: report.groundsAreDivergentColors, hint: '5 · What each overlap shows besides the veil colour is its ground’s colour' },
    { label: 'Ground absorbs the excess', state: report.groundAssimilatesExcess, hint: '7 · If the common colour is unbalanced, the ground behind the overlap it dominates contains it (grey: balanced, not applicable)' },
    { label: 'Veil fits the ground', state: report.veilFromGround, hint: '9–10 · Y and B ask for a red veil; tertiaries sharing a subordinate ask for more of it (grey: the book gives no rule)' },
    { label: 'Balanced transparency', state: report.balancedTransparency, hint: 't recovered over A equals t recovered over B (linear light)' },
    { label: 'Alpha consistency', state: report.alphaConsistency, hint: 'α agrees across the R, G, B channels within Da Pos’s ±0.05' },
  ];

  const Section = ({ title, rows }: { title: string; rows: Row[] }) => (
    <div>
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h4>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex gap-2 text-sm" title={r.hint}>
            <Indicator state={r.state} />
            <span className={r.state === false ? 'text-ink' : 'text-muted'}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold"
          style={{
            backgroundColor: report.overallValid ? '#E5EEE4' : '#F3E2E0',
            color: report.overallValid ? '#33552F' : '#7A3A34',
          }}
        >
          {report.overallValid ? '✓ Valid transparency' : '✗ Not yet valid'}
        </span>
      </div>
      <Section title="Metelli conditions" rows={metelli} />
      <Section title="Garau conditions" rows={garau} />
    </div>
  );
}
