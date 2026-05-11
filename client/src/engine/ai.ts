import { evaluateBestHand } from './handEvaluator';
import { legalActions, totalPotIncludingStreet } from './pokerEngine';
import type {
  AIPersonality,
  ActionType,
  Card,
  Rank,
  TableState,
} from '../types';

/* -----------------------------------------------------------------------------
 * AI for poker opponents.
 *
 * Goal: distinct, *plausible* play styles — not GTO-optimal.
 * The fun in a tycoon poker game comes from reading personalities, not
 * losing to a perfect solver.
 *
 * Methodology:
 *   1. Compute hand strength (preflop: Chen-like formula; postflop: relative
 *      strength among all 7-card hands seen so far + outs).
 *   2. Combine with personality biases to produce action probabilities.
 *   3. Sample an action; if raising, choose a sizing within a personality range.
 * --------------------------------------------------------------------------- */

interface PersonalityProfile {
  /** Min hand strength (0..1) to play preflop. Looser = lower. */
  preflopThreshold: number;
  /** Min strength to call a bet postflop. */
  callThreshold: number;
  /** Min strength to raise. */
  raiseThreshold: number;
  /** Probability of bluffing with a weak hand. */
  bluffFreq: number;
  /** Aggression multiplier — affects raise sizes. */
  aggression: number;
  /** Tilt resistance — irrelevant currently, reserved for adaptation. */
  tiltResistance: number;
}

const PROFILES: Record<AIPersonality, PersonalityProfile> = {
  tightPassive: {
    preflopThreshold: 0.55,
    callThreshold: 0.35,
    raiseThreshold: 0.75,
    bluffFreq: 0.04,
    aggression: 0.6,
    tiltResistance: 0.8,
  },
  tightAggressive: {
    preflopThreshold: 0.5,
    callThreshold: 0.4,
    raiseThreshold: 0.6,
    bluffFreq: 0.12,
    aggression: 1.1,
    tiltResistance: 0.7,
  },
  loosePassive: {
    preflopThreshold: 0.3,
    callThreshold: 0.2,
    raiseThreshold: 0.7,
    bluffFreq: 0.06,
    aggression: 0.7,
    tiltResistance: 0.55,
  },
  looseAggressive: {
    preflopThreshold: 0.28,
    callThreshold: 0.3,
    raiseThreshold: 0.45,
    bluffFreq: 0.22,
    aggression: 1.4,
    tiltResistance: 0.5,
  },
  maniac: {
    preflopThreshold: 0.18,
    callThreshold: 0.2,
    raiseThreshold: 0.3,
    bluffFreq: 0.4,
    aggression: 1.8,
    tiltResistance: 0.3,
  },
};

/* -------------------------------------------------------------------------- */
/* Hand strength estimation                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Preflop strength via a simplified Chen-style formula, normalized 0..1.
 * Reasonably aligned with real preflop equities.
 */
function preflopStrength(hole: [Card, Card]): number {
  const [a, b] = hole;
  const high = Math.max(a.rank, b.rank);
  const low = Math.min(a.rank, b.rank);
  const suited = a.suit === b.suit;
  const pair = a.rank === b.rank;
  const gap = high - low - 1;

  // Base from highest card
  let score: number;
  if (high === 14) score = 10;
  else if (high === 13) score = 8;
  else if (high === 12) score = 7;
  else if (high === 11) score = 6;
  else score = high / 2;

  if (pair) {
    score = Math.max(score * 2, 5);
    if (a.rank === 5) score = Math.max(score, 6);
  }
  if (suited) score += 2;

  // Gap penalty
  if (!pair) {
    if (gap === 0) score += 0; // connected
    else if (gap === 1) score -= 1;
    else if (gap === 2) score -= 2;
    else if (gap === 3) score -= 4;
    else score -= 5;
    if (gap < 2 && high < 12) score += 1;
  }

  // Normalize to 0..1 (raw range roughly -3..22)
  return Math.max(0, Math.min(1, (score + 3) / 22));
}

/**
 * Postflop strength: combine made-hand strength + drawing potential.
 * - Made hand: rank category 0..8 normalized.
 * - Outs: estimate via simple heuristics, cap at 12 outs ~ 24% improvement.
 */
function postflopStrength(hole: [Card, Card], community: Card[]): number {
  const allCards = [...hole, ...community];
  const made = evaluateBestHand(allCards);
  // Category strength roughly 0..8 → 0..1 with smoothing
  const categoryWeight: Record<typeof made.category, number> = {
    highCard: 0.15,
    pair: 0.32,
    twoPair: 0.5,
    threeOfAKind: 0.62,
    straight: 0.72,
    flush: 0.8,
    fullHouse: 0.88,
    fourOfAKind: 0.95,
    straightFlush: 0.99,
  };
  let strength = categoryWeight[made.category];

  // Add a small bonus for high pair / top pair
  if (made.category === 'pair' && made.tiebreakers[0] >= 11) strength += 0.05;
  if (made.category === 'pair' && made.tiebreakers[0] === 14) strength += 0.05;

  // Drawing potential — rough. If we have 4 to a flush or open-ended straight, bonus.
  if (community.length < 5) {
    const suitsCount: Partial<Record<Card['suit'], number>> = {};
    for (const c of allCards) suitsCount[c.suit] = (suitsCount[c.suit] ?? 0) + 1;
    const flushDraw = Object.values(suitsCount).some((n) => n === 4);
    if (flushDraw) strength = Math.max(strength, 0.55);

    const ranks = Array.from(new Set(allCards.map((c) => c.rank))).sort((a, b) => a - b) as Rank[];
    if (hasOpenEnder(ranks)) strength = Math.max(strength, 0.5);
  }

  return Math.min(1, strength);
}

function hasOpenEnder(sortedAsc: Rank[]): boolean {
  // Look for any 4-card consecutive run
  for (let i = 0; i + 3 < sortedAsc.length; i++) {
    const a = sortedAsc[i];
    const d = sortedAsc[i + 3];
    if (d - a === 3 && new Set(sortedAsc.slice(i, i + 4)).size === 4) {
      return true;
    }
  }
  return false;
}

export function estimateStrength(table: TableState, playerId: string): number {
  const seat = table.players.find((p) => p.id === playerId);
  if (!seat || !seat.hole) return 0;
  if (table.community.length === 0) return preflopStrength(seat.hole);
  return postflopStrength(seat.hole, table.community);
}

/* -------------------------------------------------------------------------- */
/* Decision making                                                              */
/* -------------------------------------------------------------------------- */

export interface AIDecision {
  type: ActionType;
  amount?: number;
  /** For UI/debug — strength estimate at the time of decision. */
  strength: number;
  bluff: boolean;
}

export function decideAction(
  table: TableState,
  playerId: string,
  rng: () => number = Math.random,
): AIDecision {
  const seat = table.players.find((p) => p.id === playerId);
  if (!seat) throw new Error(`Player ${playerId} not found`);
  const personality = seat.personality ?? 'tightPassive';
  const profile = PROFILES[personality];

  const strength = estimateStrength(table, playerId);
  const legals = legalActions(table, playerId);
  const has = (t: ActionType) => legals.find((l) => l.type === t);

  const toCall = table.currentBet - seat.currentBet;
  const potOdds = toCall > 0 ? toCall / (toCall + totalPotIncludingStreet(table)) : 0;

  // Should we even continue?
  const isPreflop = table.community.length === 0;
  const continueThreshold = isPreflop ? profile.preflopThreshold : profile.callThreshold;

  // Bluff roll
  const bluffing = rng() < profile.bluffFreq && strength < 0.4;

  // Decide
  if (toCall === 0) {
    // Check or bet
    if (strength >= profile.raiseThreshold || (bluffing && rng() < 0.4)) {
      const betAction = has('bet') ?? has('raise');
      if (betAction) return makeRaise(table, seat, profile, strength, bluffing, betAction);
    }
    // Default to check
    if (has('check')) return { type: 'check', strength, bluff: false };
    return { type: 'fold', strength, bluff: false };
  }

  // toCall > 0
  // Fold if too weak, no bluff
  const effectiveStrength = strength + (bluffing ? 0.25 : 0);
  if (effectiveStrength < continueThreshold && effectiveStrength < potOdds) {
    return { type: 'fold', strength, bluff: false };
  }

  // Raise?
  if (
    (strength >= profile.raiseThreshold || bluffing) &&
    (has('raise') || has('bet'))
  ) {
    const action = has('raise') ?? has('bet')!;
    return makeRaise(table, seat, profile, strength, bluffing, action);
  }

  // Otherwise call
  if (has('call')) return { type: 'call', strength, bluff: false };
  if (has('check')) return { type: 'check', strength, bluff: false };
  return { type: 'fold', strength, bluff: false };
}

function makeRaise(
  table: TableState,
  seat: TableState['players'][number],
  profile: PersonalityProfile,
  strength: number,
  bluffing: boolean,
  action: { type: ActionType; minAmount?: number; maxAmount?: number },
): AIDecision {
  const min = action.minAmount ?? table.blinds.bb;
  const max = action.maxAmount ?? seat.chips + seat.currentBet;
  const pot = totalPotIncludingStreet(table);
  // Base sizing: a fraction of the pot, scaled by aggression and strength
  const baseFrac = 0.5 + (strength - 0.5) * 0.6 * profile.aggression;
  let target = Math.round(pot * baseFrac + min);
  if (bluffing) target = Math.round(pot * 0.7 * profile.aggression + min);
  target = Math.max(min, Math.min(target, max));
  // Push all-in with monsters or strong bluffs at low stacks
  if (strength > 0.92 && profile.aggression > 1) {
    target = max;
  }
  return {
    type: action.type,
    amount: target,
    strength,
    bluff: bluffing,
  };
}
