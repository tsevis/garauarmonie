import { describe, it, expect } from 'vitest';
import { buildArtifact } from '../src/build.js';

describe('reproducibility', () => {
  it('regenerating the same version produces a byte-identical artifact', () => {
    const first = buildArtifact();
    const second = buildArtifact();
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('codes are unique across the whole artifact', () => {
    const artifact = buildArtifact();
    const codes = artifact.swatches.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('sRGB hexes are unique across the whole artifact (dedup actually ran)', () => {
    const artifact = buildArtifact();
    const hexes = artifact.swatches.map((s) => s.srgbHex);
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});
