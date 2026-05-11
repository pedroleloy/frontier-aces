import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapState, TravelEvent } from '../types';
import { CITIES, neighborsOf, routeCost } from '../data/cities';

interface MapStore extends MapState {
  travelTo: (cityId: string) => { ok: true; cost: number } | { ok: false; reason: string };
  finishTravel: () => void;
  setEvent: (e: TravelEvent | null) => void;
  unlockCity: (cityId: string) => void;
  reset: () => void;
}

const INITIAL: MapState = {
  currentCityId: 'coyote-bend',
  unlockedCityIds: ['coyote-bend'],
  travel: null,
  activeEvent: null,
};

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      travelTo: (cityId) => {
        const s = get();
        if (cityId === s.currentCityId) return { ok: false, reason: 'Já está aqui' };
        const neighbors = neighborsOf(s.currentCityId);
        if (!neighbors.includes(cityId)) {
          return { ok: false, reason: 'Sem rota direta — viaje por uma cidade vizinha primeiro' };
        }
        const cost = routeCost(s.currentCityId, cityId);
        set({
          travel: { fromCityId: s.currentCityId, toCityId: cityId, progress: 0 },
        });
        return { ok: true, cost };
      },
      finishTravel: () => {
        const s = get();
        if (!s.travel) return;
        const { toCityId } = s.travel;
        set({
          currentCityId: toCityId,
          unlockedCityIds: Array.from(new Set([...s.unlockedCityIds, toCityId])),
          travel: null,
        });
      },
      setEvent: (e) => set({ activeEvent: e }),
      unlockCity: (cityId) =>
        set((s) =>
          s.unlockedCityIds.includes(cityId)
            ? s
            : { unlockedCityIds: [...s.unlockedCityIds, cityId] },
        ),
      reset: () => set(INITIAL),
    }),
    { name: 'frontier-aces:map', version: 1 },
  ),
);

/** Synchronously check if a city can be unlocked given player progress. */
export function canUnlockCity(cityId: string, reputation: number, bankroll: number): boolean {
  const city = CITIES.find((c) => c.id === cityId);
  if (!city) return false;
  if (reputation < city.unlock.reputation) return false;
  if (city.unlock.bankroll && bankroll < city.unlock.bankroll) return false;
  return true;
}
