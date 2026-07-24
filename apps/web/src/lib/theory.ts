/**
 * Theory module content.
 *
 * All prose here is original exposition written to teach Garau's theory
 * accurately; it paraphrases and synthesizes rather than reproducing the book.
 * Source: Augusto Garau, *Color Harmonies* (trans. Nicola Bruno, foreword by
 * Rudolf Arnheim; University of Chicago Press, 1993; orig. *Le armonie del
 * colore*, Feltrinelli, 1984).
 */

export type FigureKind =
  | 'physicalVsPerceptual'
  | 'fourZones'
  | 'metelliMath'
  | 'chromaticScission'
  | 'tenConditions'
  | 'juxtapositions';

export interface Term {
  term: string;
  def: string;
}

export interface Chapter {
  id: string;
  n: number;
  title: string;
  /** Lead paragraph. */
  summary: string;
  /** Deeper exposition, one string per paragraph. */
  body?: string[];
  figure?: FigureKind;
  figureCaption?: string;
  terms?: Term[];
}

export const ATTRIBUTION =
  'Adapted from Augusto Garau, Color Harmonies (trans. Nicola Bruno; foreword by Rudolf Arnheim; University of Chicago Press, 1993).';

export const CHAPTERS: Chapter[] = [
  {
    id: 'what-is',
    n: 1,
    title: 'What is perceptual transparency?',
    summary:
      'A surface can be physically transparent yet look opaque, and physically opaque yet look transparent. Transparency, for Garau, is an event of perception — governed by how the visual field is organized, not by whether light physically passes through matter.',
    body: [
      'The Gestalt psychologists established the starting point: when a pattern can be seen most simply as one surface lying over another in depth, the visual system reads it that way. A single flat region then splits into two — a nearer, semi-transparent layer and the farther surface glimpsed through it. Nothing about the physics of the pigment forces this; the organization of the whole configuration does.',
      'Garau’s question follows from that. If perceived transparency is a matter of visual structure, then there must be conditions — of lightness and, above all, of colour — under which a display will or will not resolve into a veil over a background. Identifying those chromatic conditions is the project this studio makes interactive.',
    ],
    terms: [
      { term: 'Perceptual transparency', def: 'The impression that one surface is seen through another, arising from how the visual field is organized.' },
      { term: 'Physical transparency', def: 'The literal transmission of light through a material — neither necessary nor sufficient for the impression.' },
    ],
  },
  {
    id: 'four-zones',
    n: 2,
    title: 'The four zones',
    summary:
      'For a veil to be seen, a figure must cross a background made of two different regions. That yields four zones: the two backgrounds (A, B) and the two overlaps (P, Q) where the figure passes over each. Remove the second background and the effect collapses — the figure simply looks opaque.',
    body: [
      'A transparent layer is only legible by comparison. Each overlap has to be read as a blend of the veil with the particular background beneath it; with a single background there is just one overlap and nothing to compare it against, so the region reads as a flat, opaque patch. Two backgrounds give the visual system two blends that must be reconciled by one and the same veil — and that reconciliation is what the impression of transparency amounts to.',
      'The overlaps P and Q are therefore where the whole event is decided. Everything the engine computes — the veil colour, its transparency, and whether the display is valid — is derived from how P and Q relate to A and B.',
    ],
    figure: 'fourZones',
    figureCaption: 'Toggle the second background off to see the four-zone reading collapse into opacity.',
    terms: [
      { term: 'A, B', def: 'The two opaque background regions.' },
      { term: 'P, Q', def: 'The overlaps where the transparent figure crosses A and B respectively.' },
    ],
  },
  {
    id: 'metelli',
    n: 3,
    title: "Metelli's mathematics",
    summary:
      'For achromatic displays, Metelli showed that the overlap is a weighted average of the veil and the background — the model of an episcotister, a spinning sectored disk whose blur fuses two lightnesses. Per channel: P = α·A + (1−α)·t and Q = α·B + (1−α)·t.',
    body: [
      'The coefficient α is the share of the background that shows through: at α = 0 the veil is invisible and the overlaps simply equal the veil colour, at α = 1 it is fully opaque and the overlaps equal the backgrounds. A genuine transparency lives strictly between. Because the same average runs independently on the red, green and blue channels, the equations extend directly to colour.',
      'The relationship is reversible. Given the two backgrounds and the two overlaps, one can recover the veil colour and α — the basis of the Composer’s Inverse mode. But averaging is only a necessary condition: two displays with identical arithmetic can differ in whether they actually look transparent, which is where Garau’s chromatic structure enters.',
    ],
    figure: 'metelliMath',
    figureCaption: 'Move the sliders — the equations and the four zones update together.',
    terms: [
      { term: 'α (alpha)', def: 'The transparency coefficient: 0 is fully transparent, 1 fully opaque.' },
      { term: 'Episcotister', def: 'A rotating sectored disk whose blur fuses two lightnesses — Metelli’s physical analogue of a transparent layer.' },
      { term: 'Scission', def: 'The splitting of one perceived colour into a background component and a veil component.' },
    ],
  },
  {
    id: 'scission',
    n: 4,
    title: 'Chromatic scission & visual mixture',
    summary:
      'Garau builds on three fundamental hues — red, yellow and blue — each of which rules about half the colour circle, and which together form a complementary triad. Every other colour is read as a mixture of two of them, and it is that visible mixture, not any physical pigment, that governs transparency.',
    body: [
      'Between the primaries sit the three balanced secondaries: orange (R+Y), green (Y+B) and violet (B+R). Beyond them are the tertiaries, in which the two components are unequal — a dominant and a subordinate, roughly in a 2:1 ratio. Garau notates them with an uppercase dominant and a lowercase subordinate, so yR is a yellowish red (dominant red) and rB a reddish blue (dominant blue).',
      'This inequality is what makes transparency possible. A pure primary has no second component to give up, and a balanced secondary holds its two components too evenly to let either go; both resist splitting. An unbalanced tertiary, by contrast, is dynamic — like a leading tone in music it strains toward or away from its base — so the eye readily separates its subordinate component into a transparent layer. The disk below reads any colour this way.',
    ],
    figure: 'chromaticScission',
    figureCaption: 'Pick a colour on the disk to see its dominant/subordinate reading and how readily it splits.',
    terms: [
      { term: 'Visual mixture', def: 'A colour that appears to contain two of the three primaries to the average observer.' },
      { term: 'Dominant / subordinate', def: 'The stronger and weaker primary in a tertiary mixture, in roughly 2:1 proportion — e.g. reddish blue is dominant B, subordinate r.' },
      { term: 'Splittability', def: 'How readily a colour separates perceptually: pure primaries do not split, balanced secondaries resist, unbalanced tertiaries split most easily.' },
    ],
  },
  {
    id: 'ten-conditions',
    n: 5,
    title: 'The conditions for transparency',
    summary:
      "A convincing chromatic transparency has to satisfy Metelli's lightness conditions and Garau's chromatic ones together. Edit a display below and watch each condition hold or fail in real time.",
    body: [
      'The lightness conditions come first: the two overlaps must keep the same order as the two backgrounds (the lighter over the lighter), their contrast must be reduced relative to the backgrounds, and the recovered scission must be realizable — an α strictly between transparent and opaque. These are exactly the requirements built into Metelli’s averaging.',
      'On top of them Garau layers the chromatic conditions. Each overlap must read as a genuine visual mixture rather than a pure hue; the two overlaps must share one common component — which the eye assigns to the single veil — while their remaining, divergent components are read as the two backgrounds. When that common component sits unequally in the two overlaps, the backgrounds must adjust to compensate. Break any of these and the veil stops cohering.',
    ],
    figure: 'tenConditions',
    figureCaption: 'Adjust the colours and α; the dashboard evaluates every condition live.',
  },
  {
    id: 'juxtapositions',
    n: 6,
    title: 'The four juxtapositions',
    summary:
      'When two colours meet, they relate through the primaries they share and the ones they diverge on. Garau, following Arnheim, distinguishes four cases and groups them into balanced concord and unbalanced discord — the harmonic backbone of the whole theory.',
    body: [
      'Complete inversion involves only two primaries: the pair simply inverts the ratio, as in bR and rB, so both point back to the same secondary (violet). The two colours are closely bonded — a balanced concord.',
      'Shared subordinate keeps the same subordinate under different dominants, as in bY and bR. Between them the pair contains all three primaries in equal weight, which is Garau’s definition of complementarity — the strongest bond of all, again a balanced concord.',
      'Shared dominant keeps the same dominant over different subordinates, as in yR and bR: the two are pulled in opposite directions at once, producing tension and detachment — an unbalanced discord. Partial inversion brings in all three primaries with one role inverted, as in yR and rB, an asymmetrical clash that is also discordant.',
      'This concord/discord grouping describes harmony in the flat plane. Whether a given pair also reads well as the two overlaps of a transparency is a related but separate question, taken up in the transparency chapters — where shared-subordinate pairs prove the most convincing veils. The Analyzer’s pair mode reports both the type and that transparency reading.',
    ],
    figure: 'juxtapositions',
    figureCaption: 'Choose two colours to see their juxtaposition type and predicted transparency.',
    terms: [
      { term: 'Balanced concord', def: 'Complete inversion (e.g. bR / rB) and shared subordinate (e.g. bY / bR) — bonded, harmonious pairs.' },
      { term: 'Unbalanced discord', def: 'Shared dominant (e.g. yR / bR) and partial inversion (e.g. yR / rB) — pairs held in tension.' },
      { term: 'Complementarity', def: 'Two colours are complementary when together they contain all three primaries in equal proportion.' },
    ],
  },
  {
    id: 'additive-subtractive',
    n: 7,
    title: 'Additive, not subtractive',
    summary:
      'The averaging that governs transparency behaves additively — like overlapping lights or the temporal fusion of an episcotister — not like the subtractive mixing of physical pigments. This is why the computed mean predicts the colour the eye actually sees in the overlap.',
    body: [
      'The distinction matters because a painter mixing two pigments and a viewer perceiving a transparency are solving different problems. Transparency asks only how already-present colours behave when the eye organizes them in depth; the answer is a proportional blend, computed here per channel.',
      'It also underlies Garau’s choice of primaries. Whether green is a single sensation or a blend of blue and yellow was long debated — Hering treated it as fundamental, while da Pos found observers could fail to decompose it. Garau follows the painters’ tradition, from Runge and Delacroix to Klee and Itten, that takes red, yellow and blue as the pure primaries and green as a visible mixture (Y+B).',
    ],
  },
  {
    id: 'multiple',
    n: 8,
    title: 'Multiple transparencies',
    summary:
      'Veils can be stacked into an ordered sequence of depth planes. Each added layer must satisfy the transparency conditions against everything already beneath it, and the sequence of juxtaposition types sets the felt order of the stacking.',
    body: [
      'Because every layer is read relative to what lies below, a stack is only as legible as its weakest scission: one layer that fails the chromatic conditions breaks the depth reading for everything above it. Composing multiple transparencies is therefore a matter of chaining valid single transparencies, plane by plane.',
    ],
  },
  {
    id: 'anomalous',
    n: 9,
    title: 'An anomalous case',
    summary:
      'Garau closes with a case that strains the simple model: a display can still be seen as transparent even when the perceived background colour is not the one a strict average would require. The impression survives the departure from the arithmetic.',
    body: [
      'Such cases are revealing rather than troubling. They confirm Garau’s central claim — that transparency is driven by the chromatic structure the eye constructs, not by physical consistency alone. When the visual organization strongly favours a veil, perception will supply the reading even where the numbers do not strictly demand it.',
    ],
  },
  {
    id: 'painting',
    n: 10,
    title: 'Transparency in painting',
    summary:
      'The same structural relations painters use to bind and separate colours in the flat plane also govern transparency in depth. Garau reads works by Cézanne, Picasso, Matisse and modern colourists to show deliberate juxtapositions and veils carrying pictorial meaning.',
    body: [
      'Seen this way, the theory is an instrument of expression rather than a constraint on it. Matisse put the stance plainly: to put the colours in order is “to put order in the ideas.” Ordering hues by their shared and divergent primaries — and letting some of them read as veils over others — is one of the means by which a composition translates intended meaning into visual form.',
    ],
  },
];
