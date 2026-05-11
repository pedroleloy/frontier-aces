import { useEconomyStore } from '../stores/useEconomyStore';
import { useMapStore } from '../stores/useMapStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { SaveSlot } from '../types';
import { pushSave, pullSave } from './api';

/**
 * Combine all stores into a single SaveSlot snapshot — useful for cloud sync
 * and for showing the player a "last saved" indicator.
 *
 * Note: poker table state is intentionally NOT saved; cash games are ephemeral.
 */
export function buildSaveSlot(): SaveSlot {
  const player = usePlayerStore.getState().profile;
  const economy = useEconomyStore.getState();
  const map = useMapStore.getState();
  const now = Date.now();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    player,
    economy: {
      bankroll: economy.bankroll,
      bank: economy.bank,
      properties: economy.properties,
      inGameDay: economy.inGameDay,
      transactions: economy.transactions,
    },
    map: {
      currentCityId: map.currentCityId,
      unlockedCityIds: map.unlockedCityIds,
      travel: map.travel,
      activeEvent: map.activeEvent,
    },
    missions: [],
    achievements: [],
  };
}

/** Upload save to backend (silent on failure — game still works offline). */
export async function syncToCloud(): Promise<boolean> {
  const slot = buildSaveSlot();
  const res = await pushSave(slot);
  return res.ok;
}

export async function loadFromCloud(playerId: string): Promise<SaveSlot | null> {
  return pullSave(playerId);
}
