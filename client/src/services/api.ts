import type { SaveSlot } from '../types';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/**
 * Attempts to sync save with backend. If the server is offline (e.g. local dev
 * without server, or static deploy on Vercel), gracefully falls back — Zustand
 * `persist` middleware already keeps localStorage copies, so the game stays
 * fully playable.
 */
export async function pushSave(save: SaveSlot): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`${BASE}/saves/${encodeURIComponent(save.player.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export async function pullSave(playerId: string): Promise<SaveSlot | null> {
  try {
    const res = await fetch(`${BASE}/saves/${encodeURIComponent(playerId)}`);
    if (!res.ok) return null;
    return (await res.json()) as SaveSlot;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(): Promise<
  { name: string; reputation: number; bankroll: number; level: number }[]
> {
  try {
    const res = await fetch(`${BASE}/leaderboard`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
