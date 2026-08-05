# Garau Transparency — Photoshop plugin

A UXP panel that brings Augusto Garau's perceptual color theory into
Photoshop, across two tabs. It is a **thin client** of two packages —
`@garau/engine` and `@garau/swatches` — the same ones that power the web
studio and Nino's own Augusto workspace.

## What it does

**Composer** — Metelli's four-zone transparency tool:

- **Forward** — set two backgrounds (A, B), a veil color (t) and transparency
  (α); the panel computes the two overlap colors (P, Q).
- **Inverse** — sample two overlaps (P, Q) and recover the veil color and α.
- Live **validity**, **quality score**, **juxtaposition type**, and each color's
  Garau notation.

**Library** — the open, self-explaining Augusto swatch system
(`documents/OpenColorSystem-Proposal.md` in the Nino repo), browsable the way
Pantone Connect lets you browse Pantone's, except every entry here carries
its Garau decomposition and its live concord neighbours instead of an opaque
code:

- Search by name or code, or filter by Garau notation.
- Click a swatch for its full decomposition (dominant/subordinate,
  splittability), hex and OKLCH values, and up to twelve concord neighbours
  computed live against the whole ~1,200-swatch library.
- **+ Swatches** adds it to Photoshop's own Swatches panel — see the caveat
  below before relying on this one.

Both tabs share:

- **FG** pulls the current Photoshop foreground color into a slot.
- **→ FG** sets the foreground to a computed color; **Fill** fills the active
  selection (or layer) with it.

## Build

From the monorepo root (builds `@garau/engine` and `@garau/swatches` first,
then the plugin bundle):

```bash
npm install
npm run build:engine
npm run build --workspace @garau/swatches
npm run build --workspace photoshop
```

This produces `dist/index.js` (the bundled engine + panel). `photoshop` and
`uxp` are left as host `require()`s — Photoshop provides them at runtime.
The Library tab fetches `swatches/v1.0.0.json`, a checked-in copy of
`packages/swatches/dist/v1.0.0.json` — the same artifact `@garau/swatches`
generates and Nino's `NinoSwatches` module loads. Regenerating the grid
(`npm run generate --workspace @garau/swatches`) means re-copying that file
here too, the same way Nino's own copy under `Sources/NinoSwatches/Resources`
has to be kept in sync.

## Load in Photoshop

1. Install the **[Adobe UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/)** (UDT) and Photoshop 2023+ (24.0+).
2. In UDT: **Add Plugin** → select this folder's `manifest.json`.
3. Click **Load**. The **Garau Transparency** panel appears under
   *Plugins → Garau Transparency* in Photoshop.
4. After code changes, re-run the build and press **Reload** in UDT.

## Notes

- The panel opens on a valid demo transparency (crimson / sky-blue backgrounds,
  coral veil). Press **FG** on A/B/t to drive it from your own document colors.
- Native `<input type="color">` is not available in UXP, so colors are entered as
  hex or pulled from the document — the Photoshop-native workflow.
- All document-mutating calls run inside `executeAsModal`; setting color and
  filling use stable batchPlay action descriptors, checked against a real
  Photoshop document.

### `+ Swatches` is not yet verified

Every other document action here (`setForegroundRGB`, `fillWithRGB`) was
checked against a running Photoshop. `addSwatchToPanel` — the "make a
colorSwatch" action `+ Swatches` calls, in `src/psBridge.ts` — was not: there
was no Photoshop available to build this against, only the documented shape
of the Action Manager idiom the rest of this file already uses and is
verified for. If it errors, the panel shows Photoshop's own message; open
**File ▸ Scripts ▸ Script Events Manager** (or the standalone ScriptListener
plugin) in a real Photoshop, add a swatch by hand, and correct
`_target`/`using` in `addSwatchToPanel` to match what it actually logs.

## Preview outside Photoshop

The panel UI and all engine math run in a normal browser (document actions are
disabled and labeled "Preview mode"):

```bash
cd apps/photoshop && python3 -m http.server 5185
# open http://localhost:5185/index.html
```
