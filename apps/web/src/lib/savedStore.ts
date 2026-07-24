import { useCallback, useEffect, useState } from 'react';
import type { Preset } from './presets';

const KEY = 'garau.saved.v1';

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
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
