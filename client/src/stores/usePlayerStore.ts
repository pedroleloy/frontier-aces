import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerProfile, ReputationTier } from '../types';

const REPUTATION_TIERS: { min: number; tier: ReputationTier }[] = [
  { min: 0, tier: 'drifter' },
  { min: 250, tier: 'gambler' },
  { min: 600, tier: 'highRoller' },
  { min: 900, tier: 'legend' },
];

function tierFor(rep: number): ReputationTier {
  return [...REPUTATION_TIERS].reverse().find((t) => rep >= t.min)!.tier;
}

function xpForLevel(level: number): number {
  // Quadratic curve. Level 1->2 = 100xp. Level 9->10 = 8100xp.
  return 100 * level * level;
}

interface PlayerState {
  profile: PlayerProfile;
  setName: (name: string) => void;
  addXp: (xp: number) => void;
  addReputation: (delta: number) => void;
  recordHand: (won: boolean, potSize: number) => void;
  recordTournamentWin: () => void;
  reset: () => void;
}

const INITIAL: PlayerProfile = {
  id: 'hero',
  name: 'Forasteiro',
  avatarSeed: 'hero',
  level: 1,
  xp: 0,
  reputation: 0,
  tier: 'drifter',
  stats: {
    handsPlayed: 0,
    handsWon: 0,
    showdownsWon: 0,
    biggestPot: 0,
    tournamentsWon: 0,
  },
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      profile: INITIAL,
      setName: (name) =>
        set((s) => ({ profile: { ...s.profile, name: name.trim() || 'Forasteiro' } })),
      addXp: (xp) =>
        set((s) => {
          let newXp = s.profile.xp + xp;
          let newLevel = s.profile.level;
          while (newXp >= xpForLevel(newLevel)) {
            newXp -= xpForLevel(newLevel);
            newLevel += 1;
          }
          return { profile: { ...s.profile, xp: newXp, level: newLevel } };
        }),
      addReputation: (delta) =>
        set((s) => {
          const rep = Math.max(0, Math.min(1000, s.profile.reputation + delta));
          return { profile: { ...s.profile, reputation: rep, tier: tierFor(rep) } };
        }),
      recordHand: (won, potSize) =>
        set((s) => ({
          profile: {
            ...s.profile,
            stats: {
              ...s.profile.stats,
              handsPlayed: s.profile.stats.handsPlayed + 1,
              handsWon: s.profile.stats.handsWon + (won ? 1 : 0),
              biggestPot: Math.max(s.profile.stats.biggestPot, potSize),
            },
          },
        })),
      recordTournamentWin: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            stats: { ...s.profile.stats, tournamentsWon: s.profile.stats.tournamentsWon + 1 },
          },
        })),
      reset: () => set({ profile: INITIAL }),
    }),
    { name: 'frontier-aces:player', version: 1 },
  ),
);

export const xpRequired = xpForLevel;
