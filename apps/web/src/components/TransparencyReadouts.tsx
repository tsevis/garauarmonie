import type { BalanceReading, TransparencyDegree } from '@garau/engine';

/** What each degree means in the book (condition 8, plates 35–39). */
export const DEGREE_HINT: Record<TransparencyDegree, string> = {
  'Very transparent':
    'The common colour is subordinate in both overlaps: the veil reads clearly and lightly (condition 8, pl. 35).',
  'Nearly opaque':
    'The common colour is dominant in both overlaps: unified and balanced, but little transparent (condition 8, pl. 36).',
  Intermediate:
    'The common colour plays different roles in the two overlaps; the book gives no degree for this case, and the ground must absorb the excess (condition 7, pl. 37, 39).',
};

const DEGREE_STYLE: Record<TransparencyDegree, { bg: string; fg: string }> = {
  'Very transparent': { bg: '#E3ECF2', fg: '#2F4E63' },
  Intermediate: { bg: '#ECE9E4', fg: '#5A554E' },
  'Nearly opaque': { bg: '#EFE4D8', fg: '#6A4A2B' },
};

const GOOD = '#4E7A51';
const FAIR = '#B0873E';
const POOR = '#B4534B';
const GOOD_FROM = 85;
const FAIR_FROM = 60;

const barColor = (score: number): string => (score >= GOOD_FROM ? GOOD : score >= FAIR_FROM ? FAIR : POOR);

interface Props {
  degree: TransparencyDegree | null;
  balance: BalanceReading | null;
  /** Shown instead of the readouts when they do not apply. */
  emptyNote?: string;
}

/**
 * Garau's two transparency readouts, kept apart: the degree of transparency
 * (condition 8) and the balance of the veil (condition 6). The book ranks the
 * juxtaposition types on neither one scale, so no single score is shown.
 */
export default function TransparencyReadouts({ degree, balance, emptyNote }: Props) {
  if (degree === null && balance === null) {
    return <p className="text-sm leading-relaxed text-muted">{emptyNote ?? 'Not applicable to this display.'}</p>;
  }
  return (
    <div className="space-y-3">
      {degree !== null && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Degree of transparency</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: DEGREE_STYLE[degree].bg, color: DEGREE_STYLE[degree].fg }}
            >
              {degree}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{DEGREE_HINT[degree]}</p>
        </div>
      )}
      {balance !== null && (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Balance</span>
            <span className="font-mono text-sm text-ink">
              {balance.score}/100 · {balance.balanced ? 'balanced' : 'unbalanced'}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full" style={{ width: `${balance.score}%`, backgroundColor: barColor(balance.score) }} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            How equally the common colour is present in the two (condition 6).
          </p>
        </div>
      )}
    </div>
  );
}
