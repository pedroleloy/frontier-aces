import { useEffect, useRef } from 'react';
import { useMapStore } from '../stores/useMapStore';

/**
 * Animates the active travel by ramping `travel.progress` from 0 to 1 over
 * `durationMs`, then commits the destination via `finishTravel()`.
 */
export function useTravelAnimation(durationMs = 2200): void {
  const travel = useMapStore((s) => s.travel);
  const finishTravel = useMapStore((s) => s.finishTravel);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!travel) {
      startedAt.current = null;
      return;
    }
    startedAt.current = performance.now();
    let raf = 0;
    const step = (t: number) => {
      if (startedAt.current == null) return;
      const elapsed = t - startedAt.current;
      const progress = Math.min(1, elapsed / durationMs);
      // Mutate via setState directly — but Zustand's `set` is the standard way.
      // We use the store's internal `setState` API for tween-only updates.
      useMapStore.setState((s) => (s.travel ? { travel: { ...s.travel, progress } } : s));
      if (progress >= 1) {
        finishTravel();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [travel?.fromCityId, travel?.toCityId, durationMs, finishTravel, travel]);
}
