/**
 * Regions and borders of a flat SVG composition, for the Continuum tab.
 *
 * Each shape is painted off-screen in its own ID colour, in stacking order, so
 * overlaps resolve the way the eye sees them; neighbouring pixels with
 * different IDs are a border, and their count is its length. The SVG is only
 * ever drawn through <img>, so its scripts never run; it is also stripped of
 * scripts and event attributes before export.
 */

export const MAX_SVG_BYTES = 5_000_000;
export const MAX_SHAPES = 2000;
const RASTER_SIDE = 900;
const MIN_BORDER = 4;
const SHAPES = 'path, polygon, polyline, rect, circle, ellipse';
const NON_PAINTED = 'defs, clipPath, mask, pattern, symbol, marker';
const UNSAFE = 'script, foreignObject, iframe, object, embed';

export interface ParsedSvg {
  readonly source: string;
  readonly shapeCount: number;
  readonly width: number;
  readonly height: number;
}

export interface Regions {
  readonly ids: Uint32Array;
  readonly w: number;
  readonly h: number;
  /** Region ids ("s0", "s1", …) that are visible, in stacking order. */
  readonly regions: readonly string[];
  readonly borders: readonly { a: string; b: string; length: number }[];
}

export const regionId = (index: number): string => `s${index}`;
export const idToRgb = (id: number): [number, number, number] => [id & 255, (id >> 8) & 255, (id >> 16) & 255];
export const rgbToId = (r: number, g: number, b: number): number => r | (g << 8) | (b << 16);

/** Border lengths between raster IDs (0 = no shape), bridging one-pixel anti-aliasing seams. Keys are "a|b", a < b. */
export function countBorders(ids: Uint32Array, w: number, h: number, minLength = MIN_BORDER): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  const look = (a: number, first: number, second: number | null) => {
    const b = first !== 0 ? first : (second ?? 0);
    if (b !== 0 && b !== a) add(a, b);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = ids[y * w + x]!;
      if (a === 0) continue;
      if (x + 1 < w) look(a, ids[y * w + x + 1]!, x + 2 < w ? ids[y * w + x + 2]! : null);
      if (y + 1 < h) look(a, ids[(y + 1) * w + x]!, y + 2 < h ? ids[(y + 2) * w + x]! : null);
    }
  }
  return new Map([...counts].filter(([, n]) => n >= minLength));
}

function parseDoc(source: string): Document {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
    throw new Error('This file is not a readable SVG.');
  }
  doc.querySelectorAll(UNSAFE).forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const bad = attr.name.toLowerCase().startsWith('on') || /^\s*javascript:/i.test(attr.value);
      if (bad) el.removeAttribute(attr.name);
    }
  });
  return doc;
}

function paintedShapes(doc: Document): Element[] {
  return [...doc.querySelectorAll(SHAPES)].filter((el) => !el.closest(NON_PAINTED));
}

function size(svg: Element): { width: number; height: number } {
  const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2]! > 0 && vb[3]! > 0) return { width: vb[2]!, height: vb[3]! };
  const w = parseFloat(svg.getAttribute('width') ?? '');
  const h = parseFloat(svg.getAttribute('height') ?? '');
  return w > 0 && h > 0 ? { width: w, height: h } : { width: 800, height: 600 };
}

/** Validate an SVG at the boundary: size, parse, painted shapes. */
export function parseSvg(source: string): ParsedSvg {
  if (source.length > MAX_SVG_BYTES) throw new Error('This SVG is larger than 5 MB.');
  const doc = parseDoc(source);
  const shapeCount = paintedShapes(doc).length;
  if (shapeCount === 0) throw new Error('No filled shapes found (paths, polygons, rectangles, circles).');
  if (shapeCount > MAX_SHAPES) throw new Error(`Too many shapes (${shapeCount}); the limit is ${MAX_SHAPES}.`);
  return { source, shapeCount, ...size(doc.documentElement) };
}

/** The SVG with every shape filled flat: by `fill(index)`, or left out when it returns null. */
export function paintSvg(parsed: ParsedSvg, fill: (index: number) => string | null, outline?: number): string {
  const doc = parseDoc(parsed.source);
  const svg = doc.documentElement;
  svg.setAttribute('width', String(parsed.width));
  svg.setAttribute('height', String(parsed.height));
  paintedShapes(doc).forEach((el, i) => {
    const colour = fill(i);
    const stroke = i === outline ? `stroke:#111;stroke-width:${Math.max(parsed.width, parsed.height) / 200}` : 'stroke:none';
    el.setAttribute('style', colour ? `fill:${colour};fill-opacity:1;opacity:1;${stroke}` : 'display:none');
  });
  return new XMLSerializer().serializeToString(doc);
}

export const svgDataUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The SVG could not be drawn.'));
    img.src = url;
  });
}

/** Paint every shape in its ID colour, read the pixels back, and measure the borders. */
export async function findRegions(parsed: ParsedSvg): Promise<Regions> {
  const scale = RASTER_SIDE / Math.max(parsed.width, parsed.height);
  const [w, h] = [Math.round(parsed.width * scale), Math.round(parsed.height * scale)];
  const idSvg = paintSvg(parsed, (i) => {
    const [r, g, b] = idToRgb(i + 1);
    return `rgb(${r},${g},${b})`;
  }).replace('<svg', '<svg shape-rendering="crispEdges"');
  const img = await loadImage(svgDataUrl(idSvg));
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [w, h];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser cannot read canvas pixels.');
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const valid = parsed.shapeCount;
  const ids = new Uint32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (px[p * 4 + 3]! < 250) continue; // transparent or blended edge
    const id = rgbToId(px[p * 4]!, px[p * 4 + 1]!, px[p * 4 + 2]!);
    if (id >= 1 && id <= valid) ids[p] = id;
  }
  const seen = new Set(ids);
  const regions = [...Array(valid).keys()].filter((i) => seen.has(i + 1)).map(regionId);
  const borders = [...countBorders(ids, w, h)].map(([key, length]) => {
    const [a, b] = key.split('|').map(Number);
    return { a: regionId(a! - 1), b: regionId(b! - 1), length };
  });
  return { ids, w, h, regions, borders };
}

/** The region under a point of the displayed image, given as fractions of its width and height. */
export function regionAt(r: Regions, fx: number, fy: number): string | null {
  const [x, y] = [Math.floor(fx * r.w), Math.floor(fy * r.h)];
  if (x < 0 || y < 0 || x >= r.w || y >= r.h) return null;
  const id = r.ids[y * r.w + x]!;
  return id === 0 ? null : regionId(id - 1);
}
