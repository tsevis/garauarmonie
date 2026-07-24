import { useState } from 'react';
import { CHAPTERS, ATTRIBUTION, type Chapter, type FigureKind } from '../lib/theory';
import MetelliMathFigure from '../components/theory/MetelliMathFigure';
import FourZonesFigure from '../components/theory/FourZonesFigure';
import TenConditionsFigure from '../components/theory/TenConditionsFigure';
import ChromaticScissionFigure from '../components/theory/ChromaticScissionFigure';
import JuxtapositionsFigure from '../components/theory/JuxtapositionsFigure';

function Figure({ kind }: { kind: FigureKind }) {
  switch (kind) {
    case 'metelliMath':
      return <MetelliMathFigure />;
    case 'fourZones':
      return <FourZonesFigure />;
    case 'tenConditions':
      return <TenConditionsFigure />;
    case 'chromaticScission':
      return <ChromaticScissionFigure />;
    case 'juxtapositions':
      return <JuxtapositionsFigure />;
    default:
      return null;
  }
}

function ChapterView({ chapter }: { chapter: Chapter }) {
  return (
    <article className="space-y-6">
      <header>
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">
          Chapter {chapter.n}
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{chapter.title}</h2>
      </header>

      <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-ink">{chapter.summary}</p>

      {chapter.body && (
        <div className="max-w-2xl space-y-4">
          {chapter.body.map((para, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink/80">
              {para}
            </p>
          ))}
        </div>
      )}

      {chapter.figure && (
        <figure className="space-y-2">
          <Figure kind={chapter.figure} />
          {chapter.figureCaption && (
            <figcaption className="text-center text-xs text-muted">{chapter.figureCaption}</figcaption>
          )}
        </figure>
      )}

      {chapter.terms && chapter.terms.length > 0 && (
        <div className="max-w-2xl rounded-md border border-line bg-panel p-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Key terms</h3>
          <dl className="space-y-2">
            {chapter.terms.map((t) => (
              <div key={t.term} className="text-sm">
                <dt className="inline font-semibold text-ink">{t.term}. </dt>
                <dd className="inline text-muted">{t.def}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </article>
  );
}

export default function Theory() {
  const [activeId, setActiveId] = useState<string>(CHAPTERS[0]!.id);
  const index = CHAPTERS.findIndex((c) => c.id === activeId);
  const chapter = CHAPTERS[index]!;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="lg:sticky lg:top-6 lg:self-start">
        <ol className="space-y-0.5">
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-baseline gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                  c.id === activeId ? 'bg-ink text-paper' : 'text-muted hover:bg-line/60 hover:text-ink'
                }`}
              >
                <span className="font-mono text-xs opacity-70">{c.n}</span>
                <span className="leading-tight">{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div>
        <ChapterView chapter={chapter} />

        <div className="mt-10 flex justify-between border-t border-line pt-4">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setActiveId(CHAPTERS[index - 1]!.id)}
            className="text-sm text-muted enabled:hover:text-ink disabled:opacity-40"
          >
            {index > 0 ? `← ${CHAPTERS[index - 1]!.title}` : ''}
          </button>
          <button
            type="button"
            disabled={index === CHAPTERS.length - 1}
            onClick={() => setActiveId(CHAPTERS[index + 1]!.id)}
            className="text-right text-sm text-muted enabled:hover:text-ink disabled:opacity-40"
          >
            {index < CHAPTERS.length - 1 ? `${CHAPTERS[index + 1]!.title} →` : ''}
          </button>
        </div>

        <p className="mt-6 max-w-2xl text-xs italic leading-relaxed text-muted">{ATTRIBUTION}</p>
      </div>
    </div>
  );
}
