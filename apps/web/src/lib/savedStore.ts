import { useCallback, useEffect, useState } from 'react';
import type { Preset } from './presets';

const KEY = 'garau.saved.v1';

/** Presets saved before 2026-11-04 carry a single `quality` score and no degree. */
const normalise = (p: Preset): Preset => ({ ...p, jt: p.jt ?? null, degree: p.degree ?? null });

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Preset[]).map(normalise) : [];
  } catch (err) {
    console.warn('Saved presets could not be read; starting empty.', err);
    return [];
  }
}

/** Persisted collection of user-saved presets. */
export function useSavedPresets() {
  const [saved, setSaved] = useState<Preset[]>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, [saved]);

  const save = useCallback((preset: Preset) => {
    setSaved((cur) => [preset, ...cur]);
  }, []);

  const remove = useCallback((id: string) => {
    setSaved((cur) => cur.filter((p) => p.id !== id));
  }, []);

  return { saved, save, remove };
}
