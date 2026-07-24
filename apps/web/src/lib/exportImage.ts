/** Export an on-page SVG as a standalone .svg file or a rasterized .png. */

function serialize(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const vb = svg.viewBox.baseVal;
  if (vb && vb.width) {
    clone.setAttribute('width', String(vb.width));
    clone.setAttribute('height', String(vb.height));
  }
  return new XMLSerializer().serializeToString(clone);
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadSvg(svg: SVGSVGElement, filename: string): void {
  const blob = new Blob([serialize(svg)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  const vb = svg.viewBox.baseVal;
  const w = Math.round((vb?.width || svg.clientWidth || 560) * scale);
  const h = Math.round((vb?.height || svg.clientHeight || 440) * scale);

  const svgUrl = URL.createObjectURL(new Blob([serialize(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.width = w;
    img.height = h;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to rasterize SVG'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    const pngUrl = URL.createObjectURL(blob);
    triggerDownload(pngUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
