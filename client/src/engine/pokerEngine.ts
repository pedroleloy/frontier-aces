import { newShuffledDeck, randomSeed } from './deck';
import { evaluateBestHand } from './handEvaluator';
import type {
  ActionType,
  PlayerSeat,
  ShowdownResult,
  SidePot,
  Street,
  TableState,
} from '../types';

/* -----------------------------------------------------------------------------
 * Texas Hold'em engine
 *
 * Design: pure functions that take a TableState and return a new TableState.
 * No mutation. No external dependencies. UI/store wraps these calls.
 * --------------------------------------------------------------------------- */

export interface CreateTableConfig {
  tableId: string;
  players: Pick<PlayerSeat, 'id' | 'name' | 'chips' | 'isHero' | 'avatarSeed'> &
    { personality?: PlayerSeat['personality'] }[] extends (infer _U)[] ? never : never;
}

interface CreateTableInput {
  tableId: string;
  players: {
    id: string;
    name: string;
    chips: number;
    isHero: boolean;
    avatarSeed: string;
    personality?: PlayerSeat['personality'];
  }[];
  blinds: { sb: number; bb: number; ante?: number };
  dealerIndex?: number;
  seed?: number;
}

export function createTable(input: CreateTableInput): TableState {
  const { tableId, players, blinds, dealerIndex = 0, seed = randomSeed() } = input;
  if (players.length < 2) throw new Error('Texas Hold\'em requires at least 2 players');

  const seats: PlayerSeat[] = players.map((p) => ({
    ...p,
    hole: null,
    status: 'active',
    currentBet: 0,
    totalCommitted: 0,
    hasActedThisStreet: false,
  }));

  return {
    id: tableId,
    players: seats,
    community: [],
    pot: 0,
    sidePots: [],
    street: 'idle',
    toAct: -1,
    dealerIndex,
    blinds,
    currentBet: 0,
    minRaise: blinds.bb,
    history: [],
    seed,
    deck: [],
  };
}

/* -------------------------------------------------------------------------- */
/* Hand lifecycle                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Start a new hand: shuffle, post blinds, deal hole cards, set first to act.
 */
export function startHand(prev: TableState): TableState {
  // Filter players who can play (have chips)
  const playersWithChips = prev.players.filter((p) => p.chips > 0);
  if (playersWithChips.length < 2) {
    return { ...prev, street: 'idle' };
  }

  const seed = randomSeed();
  const { deck } = newShuffledDeck(seed);

  // Reset seats
  const seats: PlayerSeat[] = prev.players.map((p) => ({
    ...p,
    hole: null,
    status: p.chips > 0 ? 'active' : 'busted',
    currentBet: 0,
    totalCommitted: 0,
    hasActedThisStreet: false,
  }));

  // Move dealer button to next active player
  const newDealerIndex = nextActiveIndex(seats, prev.dealerIndex);

  // SB and BB indexes
  const sbIndex = nextActiveIndex(seats, newDealerIndex);
  const bbIndex = nextActiveIndex(seats, sbIndex);

  // Post blinds (handle short stacks)
  const sbAmount = Math.min(prev.blinds.sb, seats[sbIndex].chips);
  const bbAmount = Math.min(prev.blinds.bb, seats[bbIndex].chips);
  seats[sbIndex] = applyBet(seats[sbIndex], sbAmount);
  seats[bbIndex] = applyBet(seats[bbIndex], bbAmount);

  // Deal 2 hole cards each (single-pass like a real dealer: one card per player, twice)
  const remaining = deck.slice();
  for (let pass = 0; pass < 2; pass++) {
    let i = nextActiveIndex(seats, newDealerIndex);
    for (let n = 0; n < seats.filter((s) => s.status === 'active').length; n++) {
      const card = remaining.shift()!;
      seats[i] = {
        ...seats[i],
        hole: pass === 0 ? [card, card] : [seats[i].hole![0], card], // placeholder twice; we fix below
      };
      i = nextActiveIndex(seats, i);
    }
  }
  // The placeholder above is messy; simpler: redeal cleanly.
  const cleanDeck = deck.slice();
  for (const s of seats) (s as PlayerSeat).hole = null;
  for (let pass = 0; pass < 2; pass++) {
    let i = nextActiveIndex(seats, newDealerIndex);
    const activeCount = seats.filter((s) => s.status === 'active').length;
    for (let n = 0; n < activeCount; n++) {
      const card = cleanDeck.shift()!;
      const seat = seats[i];
      if (pass === 0) seat.hole = [card, card]; // tmp 2nd will be replaced
      else seat.hole = [seat.hole![0], card];
      i = nextActiveIndex(seats, i);
    }
  }

  // First to act preflop = player after BB
  const firstToAct = nextActiveIndex(seats, bbIndex);

  // Min raise = bb (until someone raises)
  return {
    ...prev,
    players: seats,
    community: [],
    pot: 0,
    sidePots: [],
    street: 'preflop',
    toAct: firstToAct,
    dealerIndex: newDealerIndex,
    currentBet: bbAmount,
    minRaise: prev.blinds.bb,
    history: [
      { playerId: seats[sbIndex].id, type: 'bet', amount: sbAmount, street: 'preflop' },
      { playerId: seats[bbIndex].id, type: 'bet', amount: bbAmount, street: 'preflop' },
    ],
    seed,
    deck: cleanDeck,
    result: undefined,
  };
}

function applyBet(seat: PlayerSeat, amount: number): PlayerSeat {
  const real = Math.min(amount, seat.chips);
  return {
    ...seat,
    chips: seat.chips - real,
    currentBet: seat.currentBet + real,
    totalCommitted: seat.totalCommitted + real,
    status: seat.chips - real === 0 ? 'allin' : seat.status,
  };
}

function nextActiveIndex(seats: PlayerSeat[], fromIndex: number): number {
  const n = seats.length;
  for (let step = 1; step <= n; step++) {
    const i = (fromIndex + step) % n;
    if (seats[i].status === 'active' || seats[i].status === 'allin') return i;
  }
  return fromIndex;
}

/* -------------------------------------------------------------------------- */
/* Player action                                                               */
/* -------------------------------------------------------------------------- */

export interface ActionRequest {
  type: ActionType;
  amount?: number; // For bet/raise
}

/**
 * Apply a player action. Returns the next TableState.
 * Validates that it's the acting player's action.
 */
export function applyAction(
  prev: TableState,
  playerId: string,
  request: ActionRequest,
): TableState {
  if (prev.toAct < 0) return prev;
  const acting = prev.players[prev.toAct];
  if (acting.id !== playerId) {
    throw new Error(`Out-of-turn action: ${playerId} but expected ${acting.id}`);
  }
  if (acting.status !== 'active') {
    throw new Error(`Player ${playerId} cannot act with status ${acting.status}`);
  }

  const seats = prev.players.map((p) => ({ ...p }));
  const seat = seats[prev.toAct];
  let { currentBet, minRaise } = prev;
  const history = [...prev.history];

  switch (request.type) {
    case 'fold': {
      seat.status = 'folded';
      seat.hasActedThisStreet = true;
      history.push({ playerId, type: 'fold', street: prev.street });
      break;
    }
    case 'check': {
      if (seat.currentBet < currentBet) {
        throw new Error('Cannot check — must call or fold');
      }
      seat.hasActedThisStreet = true;
      history.push({ playerId, type: 'check', street: prev.street });
      break;
    }
    case 'call': {
      const toCall = currentBet - seat.currentBet;
      if (toCall <= 0) throw new Error('Nothing to call');
      const realCall = Math.min(toCall, seat.chips);
      const updated = applyBet(seat, realCall);
      Object.assign(seat, updated);
      seat.hasActedThisStreet = true;
      history.push({ playerId, type: 'call', amount: realCall, street: prev.street });
      break;
    }
    case 'bet':
    case 'raise': {
      const target = request.amount ?? 0;
      if (target <= currentBet) {
        throw new Error('Bet/raise must exceed current bet');
      }
      const raiseSize = target - currentBet;
      // Allow under-min raise only if it's an all-in
      const wouldBeAllIn = seat.chips <= target - seat.currentBet;
      if (raiseSize < minRaise && !wouldBeAllIn) {
        throw new Error(`Raise too small (min raise ${minRaise})`);
      }
      const need = target - seat.currentBet;
      const actual = Math.min(need, seat.chips);
      Object.assign(seat, applyBet(seat, actual));
      seat.hasActedThisStreet = true;

      const newCurrentBet = seat.currentBet;
      if (newCurrentBet > currentBet) {
        if (newCurrentBet - currentBet >= minRaise) {
          minRaise = newCurrentBet - currentBet;
        }
        currentBet = newCurrentBet;
        // When someone raises legally, all OTHER active players need to act again
        for (const s of seats) {
          if (s.id !== seat.id && s.status === 'active') s.hasActedThisStreet = false;
        }
      }
      history.push({
        playerId,
        type: request.type,
        amount: actual,
        street: prev.street,
      });
      break;
    }
    case 'allin': {
      const toAdd = seat.chips;
      Object.assign(seat, applyBet(seat, toAdd));
      seat.hasActedThisStreet = true;
      if (seat.currentBet > currentBet) {
        if (seat.currentBet - currentBet >= minRaise) {
          minRaise = seat.currentBet - currentBet;
        }
        currentBet = seat.currentBet;
        for (const s of seats) {
          if (s.id !== seat.id && s.status === 'active') s.hasActedThisStreet = false;
        }
      }
      history.push({ playerId, type: 'allin', amount: toAdd, street: prev.street });
      break;
    }
  }

  let next: TableState = {
    ...prev,
    players: seats,
    currentBet,
    minRaise,
    history,
  };

  // Check end-of-hand-by-fold (only one player left)
  const stillIn = seats.filter((s) => s.status !== 'folded' && s.status !== 'busted');
  if (stillIn.length === 1) {
    next = collectStreetBetsIntoPot(next);
    return awardPotAndEndHand(next, [stillIn[0].id]);
  }

  // Check street completion
  if (isStreetComplete(next)) {
    next = collectStreetBetsIntoPot(next);
    next = advanceStreet(next);
    return next;
  }

  // Otherwise advance toAct to next active player
  next = { ...next, toAct: nextToActIndex(next, next.toAct) };
  return next;
}

function nextToActIndex(table: TableState, fromIndex: number): number {
  const n = table.players.length;
  for (let step = 1; step <= n; step++) {
    const i = (fromIndex + step) % n;
    if (table.players[i].status === 'active') return i;
  }
  return -1;
}

function isStreetComplete(table: TableState): boolean {
  const active = table.players.filter((p) => p.status === 'active');
  if (active.length <= 1) {
    // If 0 or 1 active players (others are all-in/folded), street is complete
    return true;
  }
  // All active players have acted AND matched currentBet
  return active.every(
    (p) => p.hasActedThisStreet && p.currentBet === table.currentBet,
  );
}

function collectStreetBetsIntoPot(table: TableState): TableState {
  const seats = table.players.map((p) => ({ ...p, currentBet: 0, hasActedThisStreet: false }));
  const added = table.players.reduce((sum, p) => sum + p.currentBet, 0);
  return {
    ...table,
    players: seats,
    pot: table.pot + added,
    currentBet: 0,
    minRaise: table.blinds.bb,
  };
}

function advanceStreet(table: TableState): TableState {
  const order: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIdx = order.indexOf(table.street);
  const nextStreet = order[currentIdx + 1] ?? 'showdown';

  const deck = table.deck.slice();
  let community = [...table.community];

  if (nextStreet === 'flop') {
    // Burn 1, deal 3
    deck.shift();
    community = community.concat([deck.shift()!, deck.shift()!, deck.shift()!]);
  } else if (nextStreet === 'turn') {
    deck.shift();
    community = community.concat([deck.shift()!]);
  } else if (nextStreet === 'river') {
    deck.shift();
    community = community.concat([deck.shift()!]);
  }

  if (nextStreet === 'showdown') {
    return runShowdown({ ...table, street: 'showdown', deck, community });
  }

  // First to act post-flop = first active player after dealer
  const firstToAct = nextActiveIndex(table.players, table.dealerIndex);

  // If only one or zero active players (rest are all-in), skip to showdown directly
  // by recursively advancing streets.
  const activeCount = table.players.filter((p) => p.status === 'active').length;
  if (activeCount <= 1) {
    // Auto-advance: we still need to deal the remaining streets but no more betting.
    let auto: TableState = { ...table, street: nextStreet, deck, community };
    while (auto.street !== 'showdown') {
      auto = advanceStreet(auto);
    }
    return auto;
  }

  return {
    ...table,
    street: nextStreet,
    deck,
    community,
    toAct: firstToAct,
  };
}

/* -------------------------------------------------------------------------- */
/* Showdown & pot distribution                                                  */
/* -------------------------------------------------------------------------- */

function runShowdown(table: TableState): TableState {
  // Build side pots from totalCommitted
  const contenders = table.players.filter(
    (p) => p.status === 'active' || p.status === 'allin',
  );

  // Compute side pots: sort unique commit levels asc, layer pots.
  const allCommits = table.players
    .map((p) => p.totalCommitted)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const uniqueLevels = Array.from(new Set(allCommits));

  const sidePots: SidePot[] = [];
  let prevLevel = 0;
  for (const level of uniqueLevels) {
    const contributors = table.players.filter((p) => p.totalCommitted >= level);
    const amount = (level - prevLevel) * contributors.length;
    if (amount > 0) {
      const eligible = contributors
        .filter((p) => p.status !== 'folded' && p.status !== 'busted')
        .map((p) => p.id);
      if (eligible.length > 0) {
        // Merge with previous pot if same eligible set
        const last = sidePots[sidePots.length - 1];
        if (last && sameSet(last.eligiblePlayerIds, eligible)) {
          last.amount += amount;
        } else {
          sidePots.push({ amount, eligiblePlayerIds: eligible });
        }
      }
    }
    prevLevel = level;
  }

  // Evaluate each contender's best hand
  const evals = new Map<string, ReturnType<typeof evaluateBestHand>>();
  for (const c of contenders) {
    if (!c.hole) continue;
    evals.set(c.id, evaluateBestHand([...c.hole, ...table.community]));
  }

  const seats = table.players.map((p) => ({ ...p }));
  const winnersByPot: { playerId: string; amount: number; hand: ReturnType<typeof evaluateBestHand> | null }[] = [];

  for (const pot of sidePots) {
    const eligibleEvals = pot.eligiblePlayerIds
      .map((id) => ({ id, hand: evals.get(id) }))
      .filter((x): x is { id: string; hand: ReturnType<typeof evaluateBestHand> } => !!x.hand);
    if (eligibleEvals.length === 0) continue;

    const best = Math.max(...eligibleEvals.map((e) => e.hand.strength));
    const winners = eligibleEvals.filter((e) => e.hand.strength === best);
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount - share * winners.length;

    winners.forEach((w, idx) => {
      const extra = idx < remainder ? 1 : 0; // give odd chip(s) to first winner(s)
      const total = share + extra;
      const seat = seats.find((s) => s.id === w.id)!;
      seat.chips += total;
      winnersByPot.push({ playerId: w.id, amount: total, hand: w.hand });
    });
  }

  const result: ShowdownResult = {
    winners: winnersByPot,
    reveals: contenders
      .filter((c) => c.hole && evals.has(c.id))
      .map((c) => ({
        playerId: c.id,
        hole: c.hole!,
        hand: evals.get(c.id)!,
      })),
  };

  return {
    ...table,
    players: seats,
    pot: 0,
    sidePots: [],
    street: 'showdown',
    toAct: -1,
    result,
  };
}

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

/** Award pot directly when only one player remains (everyone else folded). */
function awardPotAndEndHand(table: TableState, winnerIds: string[]): TableState {
  const seats = table.players.map((p) => ({ ...p }));
  const totalPot = table.pot + table.players.reduce((sum, p) => sum + p.currentBet, 0);
  const share = Math.floor(totalPot / winnerIds.length);
  const remainder = totalPot - share * winnerIds.length;
  winnerIds.forEach((id, idx) => {
    const seat = seats.find((s) => s.id === id)!;
    seat.chips += share + (idx < remainder ? 1 : 0);
  });
  return {
    ...table,
    players: seats,
    pot: 0,
    sidePots: [],
    street: 'showdown',
    toAct: -1,
    result: {
      winners: winnerIds.map((id) => ({
        playerId: id,
        amount: share + (winnerIds.indexOf(id) === 0 ? remainder : 0),
        hand: null,
      })),
      reveals: [],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers exposed to UI                                                        */
/* -------------------------------------------------------------------------- */

export function legalActions(
  table: TableState,
  playerId: string,
): { type: ActionType; minAmount?: number; maxAmount?: number }[] {
  if (table.toAct < 0) return [];
  const seat = table.players[table.toAct];
  if (seat.id !== playerId) return [];
  if (seat.status !== 'active') return [];

  const toCall = table.currentBet - seat.currentBet;
  const out: { type: ActionType; minAmount?: number; maxAmount?: number }[] = [];

  out.push({ type: 'fold' });
  if (toCall === 0) {
    out.push({ type: 'check' });
  } else {
    out.push({ type: 'call' });
  }
  if (seat.chips > toCall) {
    const minRaiseTo = table.currentBet + table.minRaise;
    const maxRaiseTo = seat.currentBet + seat.chips; // all-in
    if (table.currentBet === 0) {
      out.push({
        type: 'bet',
        minAmount: Math.min(table.blinds.bb, maxRaiseTo),
        maxAmount: maxRaiseTo,
      });
    } else {
      out.push({
        type: 'raise',
        minAmount: Math.min(minRaiseTo, maxRaiseTo),
        maxAmount: maxRaiseTo,
      });
    }
  }
  out.push({ type: 'allin' });
  return out;
}

export function totalPotIncludingStreet(table: TableState): number {
  return table.pot + table.players.reduce((sum, p) => sum + p.currentBet, 0);
}
