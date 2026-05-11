import { describe, it, expect } from 'vitest';
import { applyAction, createTable, legalActions, startHand } from '../pokerEngine';

function basicTable() {
  return createTable({
    tableId: 'test',
    players: [
      { id: 'h', name: 'Hero', chips: 1000, isHero: true, avatarSeed: 'h' },
      { id: 'a', name: 'AI 1', chips: 1000, isHero: false, avatarSeed: 'a', personality: 'tightAggressive' },
      { id: 'b', name: 'AI 2', chips: 1000, isHero: false, avatarSeed: 'b', personality: 'looseAggressive' },
    ],
    blinds: { sb: 10, bb: 20 },
    seed: 12345,
  });
}

describe('pokerEngine — startHand', () => {
  it('posts blinds and deals two hole cards to each active player', () => {
    const table = startHand(basicTable());
    expect(table.street).toBe('preflop');
    expect(table.players.every((p) => p.hole && p.hole.length === 2)).toBe(true);
    // Distinct hole cards
    const allCards = table.players.flatMap((p) => p.hole!);
    const cardKeys = allCards.map((c) => `${c.rank}${c.suit}`);
    expect(new Set(cardKeys).size).toBe(cardKeys.length);
  });

  it('sets currentBet to bb amount', () => {
    const table = startHand(basicTable());
    expect(table.currentBet).toBe(20);
  });
});

describe('pokerEngine — actions', () => {
  it('validates legal actions for the player to act', () => {
    const table = startHand(basicTable());
    const actor = table.players[table.toAct];
    const legals = legalActions(table, actor.id);
    const types = legals.map((l) => l.type);
    expect(types).toContain('fold');
    expect(types).toContain('call');
    expect(types).toContain('raise');
  });

  it('throws on out-of-turn action', () => {
    const table = startHand(basicTable());
    const wrongPlayer = table.players.find((_p, i) => i !== table.toAct)!;
    expect(() => applyAction(table, wrongPlayer.id, { type: 'fold' })).toThrow();
  });

  it('plays a complete hand by folding everyone but one', () => {
    let table = startHand(basicTable());
    // Everyone folds except one — pot should go to the last remaining player
    while (table.street !== 'showdown') {
      const actor = table.players[table.toAct];
      table = applyAction(table, actor.id, { type: 'fold' });
    }
    expect(table.street).toBe('showdown');
    expect(table.result).toBeDefined();
    const totalChips = table.players.reduce((sum, p) => sum + p.chips, 0);
    // Total chips conserved (3 * 1000)
    expect(totalChips).toBe(3000);
  });

  it('plays through preflop calls -> flop -> turn -> river', () => {
    let table = startHand(basicTable());

    // Preflop: everyone calls/checks BB
    while (table.street === 'preflop') {
      const actor = table.players[table.toAct];
      const legals = legalActions(table, actor.id);
      if (legals.find((l) => l.type === 'check')) {
        table = applyAction(table, actor.id, { type: 'check' });
      } else {
        table = applyAction(table, actor.id, { type: 'call' });
      }
    }
    expect(table.community.length).toBe(3); // flop dealt

    // Flop: everyone checks
    while (table.street === 'flop') {
      const actor = table.players[table.toAct];
      table = applyAction(table, actor.id, { type: 'check' });
    }
    expect(table.community.length).toBe(4); // turn dealt

    // Turn
    while (table.street === 'turn') {
      const actor = table.players[table.toAct];
      table = applyAction(table, actor.id, { type: 'check' });
    }
    expect(table.community.length).toBe(5);

    // River
    while (table.street === 'river') {
      const actor = table.players[table.toAct];
      table = applyAction(table, actor.id, { type: 'check' });
    }
    expect(table.street).toBe('showdown');
    expect(table.result).toBeDefined();
    expect(table.result!.reveals.length).toBeGreaterThan(0);

    const totalChips = table.players.reduce((sum, p) => sum + p.chips, 0);
    expect(totalChips).toBe(3000);
  });

  it('handles a raise that resets other players hasActed flags', () => {
    let table = startHand(basicTable());
    const firstActor = table.players[table.toAct];
    table = applyAction(table, firstActor.id, { type: 'raise', amount: 60 });
    // Next two players still need to act
    expect(table.street).toBe('preflop');
    expect(table.toAct).not.toBe(-1);
  });
});

describe('pokerEngine — side pots (heads-up all-in)', () => {
  it('conserves total chips when one player goes all-in', () => {
    let table = createTable({
      tableId: 't',
      players: [
        { id: 'h', name: 'Hero', chips: 200, isHero: true, avatarSeed: 'h' },
        { id: 'a', name: 'AI', chips: 1000, isHero: false, avatarSeed: 'a' },
      ],
      blinds: { sb: 5, bb: 10 },
      seed: 7,
    });
    table = startHand(table);
    // Both go all-in
    while (table.street !== 'showdown') {
      const actor = table.players[table.toAct];
      const legals = legalActions(table, actor.id);
      const allin = legals.find((l) => l.type === 'allin');
      if (allin) table = applyAction(table, actor.id, { type: 'allin' });
      else table = applyAction(table, actor.id, { type: 'call' });
    }
    expect(table.street).toBe('showdown');
    const total = table.players.reduce((sum, p) => sum + p.chips, 0);
    expect(total).toBe(1200);
  });
});
