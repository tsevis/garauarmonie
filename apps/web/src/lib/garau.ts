/** Human-readable naming for Garau's primaries and mixtures. */
import type { DominantPrimary, GarauMixture } from '@garau/engine';

export const PRIMARY_NAME: Record<DominantPrimary, string> = {
  R: 'Red',
  Y: 'Yellow',
  B: 'Blue',
};

/** Common name for a balanced two-primary mixture (orange / green / violet). */
function secondaryName(a: DominantPrimary, b: DominantPrimary): string {
  const key = [a, b].sort().join('');
  if (key === 'RY') return 'orange';
  if (key === 'BY') return 'green';
  if (key === 'BR') return 'violet';
  return '';
}

/** A plain-language sentence describing a color's visual mixture. */
export function describeMixture(m: GarauMixture): string {
  const dom = PRIMARY_NAME[m.dominant];
  if (m.isPure || m.subordinate === null) return `A pure, unmixed ${dom}.`;
  const sub = PRIMARY_NAME[m.subordinate];
  if (m.isBalanced) {
    const name = secondaryName(m.dominant, m.subordinate);
    return `A balanced ${dom}–${sub} mixture${name ? ` — a ${name}` : ''}. Balanced mixtures resist splitting.`;
  }
  const domName = m.ratio < 0.5 ? dom : sub;
  const subName = m.ratio < 0.5 ? sub : dom;
  return `A ${subName.toLowerCase()}ish ${domName} — dominant ${domName}, subordinate ${subName}. Unbalanced mixtures split readily.`;
}

/** Short mixture-type word for a badge. */
export function mixtureType(m: GarauMixture): 'Pure' | 'Balanced' | 'Unbalanced' {
  if (m.isPure) return 'Pure';
  if (m.isBalanced) return 'Balanced';
  return 'Unbalanced';
}
