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
    { label: 'Visual mixture · P', state: report.visualMixtureP, hint: 'P reads as a mixture, not a pure primary' },
    { label: 'Visual mixture · Q', state: report.visualMixtureQ, hint: 'Q reads as a mixture, not a pure primary' },
    { label: 'Unbalanced preference', state: report.unbalancedPreference, hint: 'Unbalanced mixtures split more readily' },
    { label: 'Common color', state: report.commonColorExists, hint: 'P and Q share a component — this becomes t' },
    { label: 'Divergent colors', state: report.divergentColorsExist, hint: 'Non-shared components become the backgrounds' },
    { label: 'Balanced transparency', state: report.balancedTransparency, hint: 't present equally in P and Q' },
    { label: 'Alpha consistency', state: report.alphaConsistency, hint: 'α agrees across the R, G, B channels' },
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
