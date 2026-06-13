import { useEffect, useState } from "react";

/**
 * State synced to localStorage. SSR-safe: initializes with `initial` on the
 * server / first client render (avoiding hydration mismatch), then hydrates
 * from storage after mount and persists on every change.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted value once, after mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // Intentional post-mount hydration from the external store: we keep the
      // first render equal to `initial` to avoid an SSR/client mismatch, then
      // sync in the stored value once mounted.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
  }, [key]);

  // Persist after hydration so we never overwrite stored data with `initial`.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota/availability errors
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
