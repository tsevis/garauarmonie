# Illustrator — scoped, not built

Rule #2 asked for an Adobe Creative Suite plugin; `apps/photoshop` is that
plugin's Photoshop client. This file is the Illustrator half of the same
instruction: **"scope an Illustrator target only after Photoshop is solid,
and check UXP-vs-CEP support for Illustrator specifically before committing
rather than assuming parity."** Photoshop is solid — two tabs, built,
typechecked, and its Composer and Library both exercised end to end in
preview mode. This is that check, and its answer.

## The check

As of this writing, **UXP has no public API for Illustrator.** Adobe uses
it internally for a handful of built-in Illustrator features, but there is
no published UXP developer documentation, no third-party access outside
Adobe's NDA prerelease program, and no announced general-availability date.
UXP reached general availability for Photoshop and InDesign years ago;
Illustrator's UXP story has been unchanged for several release cycles.

The only production-viable path for a third-party Illustrator plugin today
is **CEP** (the Common Extensibility Platform) — a Chromium panel plus an
**ExtendScript** (`.jsx`) bridge to the app, packaged as a signed `.zxp`
and described by a `CSXS` XML manifest, not `manifest.json`. It is a
different runtime, a different scripting bridge, a different packaging and
signing toolchain, and a different debugging workflow from everything
`apps/photoshop` uses — porting `psBridge.ts`'s `batchPlay` calls or
`@garau/engine`'s TypeScript directly is not possible; only the engine
package itself (framework-agnostic, no DOM dependency) would carry over
as-is into a CEP panel's bundled JS.

## Why this is scoped and not built

Adobe has been migrating every other app (Photoshop, InDesign, XD before
its retirement) off CEP and onto UXP for several years, and has said
Illustrator is next whenever its UXP work reaches parity — CEP is the
platform being phased out, not the one to invest new infrastructure in.
Building a full CEP plugin now would mean standing up an entirely separate
toolchain (ExtendScript, CSXS manifests, ZXP signing) for a target Adobe's
own roadmap is moving away from, on no committed timeline, for a feature
that was conditional in the plan to begin with ("only after Photoshop is
solid... before committing rather than assuming parity" — the check first,
not an unconditional build). That is a poor trade against the rest of the
plan's scope.

## What does carry over, whenever this is picked up

- **`@garau/engine`** — zero DOM/runtime dependencies, so it drops into a
  CEP panel's bundled JS unchanged, the same way it already drops into
  `apps/web` and `apps/photoshop`.
- **`@garau/swatches`**' generated `v1.0.0.json`, the same static artifact
  `apps/photoshop/swatches/v1.0.0.json` is a checked-in copy of — a CEP
  Illustrator Library tab would fetch the same file, not regenerate it.
- **None of `apps/photoshop`'s UI code** (`main.ts`, `composer.ts`,
  `library.ts`, `psBridge.ts`) — UXP's DOM subset, panel lifecycle, and
  `batchPlay` action model have no CEP equivalent; a CEP panel is built
  against Illustrator's `app`/ExtendScript object model instead, which is
  a genuinely different API to write against, not a port.

## Revisit when

Adobe publishes a public UXP API for Illustrator, or the plan explicitly
calls for a CEP implementation despite the above — at which point this
file should be replaced by the actual plugin, following the same
`packages/engine` + `packages/swatches` reuse `apps/photoshop`
demonstrates.
