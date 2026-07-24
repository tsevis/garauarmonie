# Garau Armonie

A studio to **teach** Augusto Garau's color theory and **simulate** his theory of
perceptual **Color Transparency**. The name folds *Garau* into *armonie* — the
Italian of his book, *Le armonie del colore*.

> *In memory of Professor Augusto Garau (1923–2010) — painter, educator, scholar.*

## Why one app

One unified web studio, several modules:

- **Composer** — the four-zone transparency simulator (primary creative tool).
- **Analyzer** — decompose any color as a Garau visual mixture; classify color pairs.
- **Gallery** — curated & saved transparency displays; recreations from *Color Harmonies*.
- **Theory** — an interactive textbook of the theory.

## Architecture

The color math lives in **one framework-agnostic TypeScript package** so every
surface is a thin client of the same engine — including a future Photoshop
plugin (Adobe UXP plugins are HTML/JS/React, so they import this package directly).

```
garauarmonie/
├── packages/
│   └── engine/        @garau/engine — the color engine (Metelli + Garau). Fully tested.
├── apps/
│   ├── web/           Teaching + simulator (Vite + React). Ships as a static site.
│   └── photoshop/     UXP plugin (Phase 2) — imports the same engine.
└── reference/         Kept, not deleted:
    ├── python-engine/   the original Python engine → test oracle
    ├── COLORHARMONIES_ENGLISH.pdf
    ├── Transparencies.png   (Garau's required irregular figure)
    └── plan.md
```

**Build order:** engine → web Composer → Theory/Gallery/Analyzer → Photoshop plugin.

## The engine

`@garau/engine` implements, per RGB channel:

- **Metelli's equations** — `P = α·A + (1−α)·t`, `Q = α·B + (1−α)·t`; forward,
  inverse, and designer modes.
- **Garau's visual-mixture system** — dominant/subordinate decomposition, notation
  (e.g. `rB`), splittability, and Arnheim's four juxtaposition types.
- **Validation** — Metelli's three conditions + Garau's ten chromatic conditions.

```bash
npm install
npm run build:engine   # compile the engine to dist/
npm run test:engine    # 24 tests: round-trips, notation, validation
```

## Provenance

Two earlier prototypes of the same idea seeded this project and remain as source
material: a React web app (`../augusto/garau-transparency-studio`, better UI) and a
Python/tkinter app (`../augustogarau`, deeper engine — now the reference oracle).
