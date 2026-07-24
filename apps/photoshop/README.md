# Garau Transparency — Photoshop plugin

A UXP panel that brings Augusto Garau's perceptual color transparency into
Photoshop. It is a **thin client of `@garau/engine`** — the exact same color
engine that powers the web studio.

## What it does

- **Forward** — set two backgrounds (A, B), a veil color (t) and transparency
  (α); the panel computes the two overlap colors (P, Q).
- **Inverse** — sample two overlaps (P, Q) and recover the veil color and α.
- Live **validity**, **quality score**, **juxtaposition type**, and each color's
  Garau notation.
- **FG** pulls the current Photoshop foreground color into a slot.
- **→ FG** sets the foreground to a computed color; **Fill** fills the active
  selection (or layer) with it.

## Build

From the monorepo root (builds `@garau/engine` first, then the plugin bundle):

```bash
npm install
npm run build:engine
npm run build --workspace photoshop
```

This produces `dist/index.js` (the bundled engine + panel). `photoshop` and
`uxp` are left as host `require()`s — Photoshop provides them at runtime.

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
  filling use stable batchPlay action descriptors.

## Preview outside Photoshop

The panel UI and all engine math run in a normal browser (document actions are
disabled and labeled "Preview mode"):

```bash
cd apps/photoshop && python3 -m http.server 5185
# open http://localhost:5185/index.html
```
