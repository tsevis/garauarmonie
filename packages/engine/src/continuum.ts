/**
 * Garau's chromatic continuum as a colouring rule for compositions.
 *
 * Color Harmonies, ch. 1: colours that share a primary bind into one surface
 * (complete inversion, shared subordinate, shared dominant); partial inversion
 * divides areas or depth planes; a pure colour crowns a passage only where it
 * is brighter than the mixtures below it (plates 6-8). Here a composition is a
 * graph of regions and the borders between them, and the solver picks one of
 * the twelve colours of Garau's circle for every region.
 */

import type { DominantPrimary } from './types.js';
import { GARAU_CIRCLE } from './visualMixture.js';

export type BorderRelation = 'bind' | 'divide' | 'contrast' | 'repeat';

export interface ContinuumBorder {
  readonly a: string;
  readonly b: string;
  /** Shared boundary length, in any unit; longer borders weigh more. */
  readonly length: number;
}

export interface ContinuumGraph {
  readonly regions: readonly string[];
  readonly borders: readonly ContinuumBorder[];
}

export interface ContinuumPlan {
  /** Regions whose colour the user fixed, as circle notations. */
  readonly locks?: Readonly<Record<string, string>>;
  /** The one region that may carry a pure colour. */
  readonly apex?: { readonly region: string; readonly primary: DominantPrimary };
  /** Areas: borders inside an area should bind, borders between areas divide. */
  readonly groups?: Readonly<Record<string, string>>;
  /** 0 favours contrast between areas, 1 favours continuity inside them. */
  readonly continuity?: number;
  readonly seed?: number;
  /** How many distinct proposals to return. */
  readonly count?: number;
}

export interface ContinuumSolution {
  readonly colours: Readonly<Record<string, string>>;
  readonly score: number;
}

const PRIMARIES: readonly DominantPrimary[] = ['R', 'Y', 'B'];
const NOTATIONS: readonly string[] = GARAU_CIRCLE.map((c) => c.notation);
const MIXTURES: readonly string[] = NOTATIONS.filter((n) => !(PRIMARIES as readonly string[]).includes(n));

// Plates 6-8: the mixtures each primary is brighter than, and so can crown.
const CROWNS: Readonly<Record<DominantPrimary, readonly string[]>> = {
  Y: ['bY', 'YB', 'yB', 'yR', 'RY', 'rY'],
  R: ['bR', 'BR', 'rB'],
  B: ['rB', 'BR'],
};

const RESTARTS = 24;
const MAX_SWEEPS = 50;
const REPEAT_PENALTY = 2;
const APEX_PENALTY = 2;
const CONTRAST_ACROSS = 0.6;

interface Parts {
  readonly kind: 'pure' | 'balanced' | 'tertiary';
  readonly dominant: DominantPrimary;
  readonly subordinate: DominantPrimary | null;
  readonly primaries: readonly DominantPrimary[];
}

function parts(notation: string): Parts {
  if (!NOTATIONS.includes(notation)) throw new Error(`Not a colour of Garau's circle: ${notation}`);
  if (notation.length === 1) {
    const p = notation as DominantPrimary;
    return { kind: 'pure', dominant: p, subordinate: null, primaries: [p] };
  }
  const [x, y] = [notation[0]!, notation[1]!];
  if (x === x.toUpperCase()) {
    const [p, q] = [x as DominantPrimary, y as DominantPrimary];
    return { kind: 'balanced', dominant: p, subordinate: q, primaries: [p, q] };
  }
  const sub = x.toUpperCase() as DominantPrimary;
  const dom = y as DominantPrimary;
  return { kind: 'tertiary', dominant: dom, subordinate: sub, primaries: [dom, sub] };
}

type Juxtaposition = 'complete inversion' | 'shared subordinate' | 'shared dominant' | 'partial inversion';

function juxtaposition(p: Parts, q: Parts): Juxtaposition | null {
  if (p.kind !== 'tertiary' || q.kind !== 'tertiary') return null;
  if (p.dominant === q.subordinate && p.subordinate === q.dominant) return 'complete inversion';
  if (p.subordinate === q.subordinate) return 'shared subordinate';
  if (p.dominant === q.dominant) return 'shared dominant';
  if (p.dominant === q.subordinate || p.subordinate === q.dominant) return 'partial inversion';
  return null;
}

/** What a border between two circle colours does to the surface. */
export function borderRelation(n1: string, n2: string): BorderRelation {
  if (n1 === n2) return 'repeat';
  const [p, q] = [parts(n1), parts(n2)];
  const jux = juxtaposition(p, q);
  if (jux === 'partial inversion') return 'divide';
  if (jux !== null) return 'bind';
  return p.primaries.some((c) => q.primaries.includes(c)) ? 'bind' : 'contrast';
}

/** Whether a pure primary is brighter than a mixture and so can stand above it (plates 6-8). */
export function canCrown(primary: DominantPrimary, mixture: string): boolean {
  return CROWNS[primary].includes(mixture);
}

const VERB: Record<BorderRelation, string> = {
  bind: 'binds',
  divide: 'divides',
  contrast: 'contrasts',
  repeat: 'repeats',
};

/** A one-line reading of a border, e.g. "yR | rB · partial inversion · divides". */
export function explainBorder(n1: string, n2: string): string {
  const relation = borderRelation(n1, n2);
  const jux = juxtaposition(parts(n1), parts(n2));
  const name = jux ?? (relation === 'bind' ? 'shared primary' : relation === 'contrast' ? 'no primary shared' : 'same colour');
  return `${n1} | ${n2} · ${name} · ${VERB[relation]}`;
}

interface Edge {
  readonly other: number;
  readonly length: number;
  readonly inside: boolean;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function borderScore(c1: string, c2: string, inside: boolean, wIn: number, wOut: number): number {
  const relation = borderRelation(c1, c2);
  if (relation === 'repeat') return -REPEAT_PENALTY;
  if (inside) return relation === 'bind' ? wIn : -wIn;
  if (relation === 'divide') return wOut;
  if (relation === 'contrast') return CONTRAST_ACROSS * wOut;
  return -wOut;
}

function validate(graph: ContinuumGraph, plan: ContinuumPlan): void {
  const known = new Set(graph.regions);
  for (const b of graph.borders) {
    if (!known.has(b.a) || !known.has(b.b)) throw new Error(`Border between unknown regions: ${b.a}, ${b.b}`);
    if (!(b.length > 0)) throw new Error(`Border ${b.a}-${b.b} needs a positive length`);
  }
  for (const [region, n] of Object.entries(plan.locks ?? {})) {
    if (!known.has(region)) throw new Error(`Lock on unknown region: ${region}`);
    parts(n);
  }
  if (plan.apex && !known.has(plan.apex.region)) throw new Error(`Apex on unknown region: ${plan.apex.region}`);
}

/**
 * Colour every region with one of Garau's twelve colours: borders inside an
 * area bind, borders between areas divide or contrast, no colour repeats
 * beside itself, and a pure colour appears only on the apex, above mixtures
 * it can crown. Deterministic for a given seed. Proposals come best first.
 */
export function solveContinuum(graph: ContinuumGraph, plan: ContinuumPlan = {}): ContinuumSolution[] {
  validate(graph, plan);
  const n = graph.regions.length;
  const index = new Map(graph.regions.map((r, i) => [r, i] as const));
  const group = (r: string) => plan.groups?.[r] ?? '';
  const edges: Edge[][] = graph.regions.map(() => []);
  for (const b of graph.borders) {
    const [i, j] = [index.get(b.a)!, index.get(b.b)!];
    const inside = group(b.a) === group(b.b);
    edges[i]!.push({ other: j, length: b.length, inside });
    edges[j]!.push({ other: i, length: b.length, inside });
  }
  const c = Math.max(0, Math.min(1, plan.continuity ?? 0.5));
  const [wIn, wOut] = [0.5 + c, 1.5 - c];
  const apex = plan.apex ? index.get(plan.apex.region)! : -1;
  const domain: string[][] = graph.regions.map((r, i) => {
    const locked = plan.locks?.[r];
    if (locked) return [locked];
    if (i === apex) return [plan.apex!.primary];
    return [...MIXTURES];
  });

  const local = (colours: string[], i: number, colour: string): number => {
    let s = 0;
    for (const e of edges[i]!) {
      const other = colours[e.other]!;
      s += e.length * borderScore(colour, other, e.inside, wIn, wOut);
      if (i === apex && !canCrown(plan.apex!.primary, other)) s -= e.length * APEX_PENALTY;
      if (e.other === apex && !canCrown(plan.apex!.primary, colour)) s -= e.length * APEX_PENALTY;
    }
    return s;
  };
  const total = (colours: string[]): number => {
    let s = 0;
    for (let i = 0; i < n; i++) s += local(colours, i, colours[i]!);
    return s / 2; // every border was counted from both sides
  };

  const random = mulberry32(plan.seed ?? 1);
  const found = new Map<string, ContinuumSolution>();
  for (let r = 0; r < RESTARTS; r++) {
    const colours = domain.map((d) => d[Math.floor(random() * d.length)]!);
    for (let sweep = 0, changed = true; changed && sweep < MAX_SWEEPS; sweep++) {
      changed = false;
      for (let i = 0; i < n; i++) {
        let best = colours[i]!;
        let bestScore = local(colours, i, best);
        for (const option of domain[i]!) {
          const s = local(colours, i, option);
          if (s > bestScore + 1e-9) [best, bestScore] = [option, s];
        }
        if (best !== colours[i]) [colours[i], changed] = [best, true];
      }
    }
    const solution: ContinuumSolution = {
      colours: Object.fromEntries(graph.regions.map((reg, i) => [reg, colours[i]!])),
      score: total(colours),
    };
    found.set(JSON.stringify(solution.colours), solution);
  }
  return [...found.values()].sort((x, y) => y.score - x.score).slice(0, plan.count ?? 5);
}
