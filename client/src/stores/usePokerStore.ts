import { create } from 'zustand';
import { applyAction, createTable, startHand } from '../engine/pokerEngine';
import { decideAction } from '../engine/ai';
import type { ActionRequest } from '../engine/pokerEngine';
import type { AIPersonality, TableState } from '../types';

interface NewTableInput {
  blinds: { sb: number; bb: number };
  heroChips: number;
  opponents: { id: string; name: string; chips: number; personality: AIPersonality; avatarSeed: string }[];
  heroName: string;
  heroSeed: string;
}

interface PokerStore {
  table: TableState | null;
  isHandActive: boolean;
  /** When true, the AI loop pauses (used while UI shows a result modal). */
  paused: boolean;
  /** Last result snapshot to show modal AFTER UI animations. */
  lastShowdown: TableState['result'] | null;
  /** Hero's chip total at start of last hand — to know how much they won/lost. */
  heroLastChips: number;

  newTable: (input: NewTableInput) => void;
  startNextHand: () => void;
  heroAction: (req: ActionRequest) => void;
  /** Drive the AI to act if it's their turn. UI calls this on each render via effect. */
  tick: () => void;
  setPaused: (p: boolean) => void;
  closeShowdown: () => void;
  endTable: () => { heroFinalChips: number };
}

export const usePokerStore = create<PokerStore>((set, get) => ({
  table: null,
  isHandActive: false,
  paused: false,
  lastShowdown: null,
  heroLastChips: 0,

  newTable: ({ blinds, heroChips, opponents, heroName, heroSeed }) => {
    const players = [
      { id: 'hero', name: heroName, chips: heroChips, isHero: true, avatarSeed: heroSeed },
      ...opponents.map((o) => ({
        id: o.id,
        name: o.name,
        chips: o.chips,
        isHero: false,
        avatarSeed: o.avatarSeed,
        personality: o.personality,
      })),
    ];
    const table = createTable({
      tableId: `table-${Date.now()}`,
      players,
      blinds,
      dealerIndex: 0,
    });
    set({ table, isHandActive: false, paused: false, lastShowdown: null });
  },

  startNextHand: () => {
    const { table } = get();
    if (!table) return;
    // Remove busted players (chips === 0 && not in current hand)
    const next = startHand(table);
    const hero = next.players.find((p) => p.isHero);
    set({
      table: next,
      isHandActive: next.street !== 'idle',
      paused: false,
      lastShowdown: null,
      heroLastChips: hero?.chips ?? 0,
    });
  },

  heroAction: (req) => {
    const { table } = get();
    if (!table) return;
    const hero = table.players.find((p) => p.isHero);
    if (!hero) return;
    if (table.players[table.toAct]?.id !== hero.id) return;
    try {
      const next = applyAction(table, hero.id, req);
      set({ table: next });
      checkShowdown(next, set);
    } catch (e) {
      console.warn('Invalid hero action', e);
    }
  },

  tick: () => {
    const { table, paused } = get();
    if (!table || paused) return;
    if (table.street === 'idle' || table.street === 'showdown') return;
    if (table.toAct < 0) return;
    const actor = table.players[table.toAct];
    if (!actor || actor.isHero) return;
    if (actor.status !== 'active') return;
    // Decide AI action
    const decision = decideAction(table, actor.id);
    try {
      const next = applyAction(table, actor.id, {
        type: decision.type,
        amount: decision.amount,
      });
      set({ table: next });
      checkShowdown(next, set);
    } catch (e) {
      // Fallback: fold
      try {
        const next = applyAction(table, actor.id, { type: 'fold' });
        set({ table: next });
        checkShowdown(next, set);
      } catch {
        console.warn('AI failed to act', e);
      }
    }
  },

  setPaused: (p) => set({ paused: p }),

  closeShowdown: () => set({ lastShowdown: null }),

  endTable: () => {
    const { table } = get();
    const hero = table?.players.find((p) => p.isHero);
    set({ table: null, isHandActive: false, lastShowdown: null });
    return { heroFinalChips: hero?.chips ?? 0 };
  },
}));

function checkShowdown(
  table: TableState,
  set: (partial: Partial<PokerStore>) => void,
) {
  if (table.street === 'showdown' && table.result) {
    set({ lastShowdown: table.result, isHandActive: false, paused: true });
  }
}
