import type { Card, HandCategory, HandRank, Rank } from '../types';
import { rankToString } from './deck';

/**
 * Hand evaluator for Texas Hold'em.
 *
 * Strategy:
 *  - Receive 5..7 cards (typically hole2 + community5).
 *  - Enumerate all 5-card subsets, evaluate each, return the best.
 *  - C(7,5) = 21 combinations, totally fine for real-time UI.
 *
 * Strength encoding:
 *  We pack [category][r1][r2][r3][r4][r5] into a single integer using
 *  base-15 weights so direct comparisons (a.strength - b.strength) work
 *  for both category and tiebreakers.
 *
 *  category: 0..8  (highCard=0, straightFlush=8)
 *  r* are ranks 2..14 sorted by importance (e.g. for full house: trips, pair, kickers).
 *
 *  Total bits: 4 (category) + 5*4 (ranks each fit in 4 bits) = 24 bits.
 */

const CATEGORY_WEIGHT: Record<HandCategory, number> = {
  highCard: 0,
  pair: 1,
  twoPair: 2,
  threeOfAKind: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  fourOfAKind: 7,
  straightFlush: 8,
};

const CATEGORY_LABEL_PT: Record<HandCategory, string> = {
  highCard: 'Carta Alta',
  pair: 'Par',
  twoPair: 'Dois Pares',
  threeOfAKind: 'Trinca',
  straight: 'Sequência',
  flush: 'Flush',
  fullHouse: 'Full House',
  fourOfAKind: 'Quadra',
  straightFlush: 'Straight Flush',
};

function packStrength(category: HandCategory, ranks: Rank[]): number {
  // Pack with base 16 (4 bits each rank slot, plenty for rank 2..14)
  let s = CATEGORY_WEIGHT[category];
  for (let i = 0; i < 5; i++) {
    s = s * 16 + (ranks[i] ?? 0);
  }
  return s;
}

/** k-combinations (returns indexes). */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  if (k > n) return result;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(idx.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return result;
}

/** Evaluate exactly 5 cards. */
function evaluate5(cards: Card[]): HandRank {
  if (cards.length !== 5) throw new Error('evaluate5 expects 5 cards');

  // Sorted by rank desc
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map((c) => c.rank) as Rank[];
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Straight detection — uses sorted unique ranks. Also handles wheel (A-2-3-4-5).
  const uniqueDescRanks = Array.from(new Set(ranks)).sort((a, b) => b - a) as Rank[];
  let straightHigh: Rank | null = null;
  if (uniqueDescRanks.length === 5) {
    const top = uniqueDescRanks[0];
    const bottom = uniqueDescRanks[4];
    if (top - bottom === 4) {
      straightHigh = top;
    } else if (
      uniqueDescRanks[0] === 14 &&
      uniqueDescRanks[1] === 5 &&
      uniqueDescRanks[2] === 4 &&
      uniqueDescRanks[3] === 3 &&
      uniqueDescRanks[4] === 2
    ) {
      // Wheel: A-2-3-4-5; straight high = 5
      straightHigh = 5;
    }
  }

  // Group by rank (count multiples)
  const counts = new Map<Rank, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  // Straight flush
  if (isFlush && straightHigh !== null) {
    const tb: Rank[] = [straightHigh, 0, 0, 0, 0] as Rank[];
    return {
      category: 'straightFlush',
      strength: packStrength('straightFlush', tb),
      tiebreakers: [straightHigh],
      cards: sorted,
      label:
        straightHigh === 14
          ? 'Royal Flush'
          : `Straight Flush até ${rankToString(straightHigh)}`,
    };
  }

  // Four of a kind
  if (groups[0][1] === 4) {
    const quad = groups[0][0];
    const kicker = groups[1][0];
    const tb = [quad, kicker, 0, 0, 0] as Rank[];
    return {
      category: 'fourOfAKind',
      strength: packStrength('fourOfAKind', tb),
      tiebreakers: [quad, kicker],
      cards: sorted,
      label: `Quadra de ${rankToString(quad)}s`,
    };
  }

  // Full house
  if (groups[0][1] === 3 && groups[1][1] >= 2) {
    const trips = groups[0][0];
    const pair = groups[1][0];
    const tb = [trips, pair, 0, 0, 0] as Rank[];
    return {
      category: 'fullHouse',
      strength: packStrength('fullHouse', tb),
      tiebreakers: [trips, pair],
      cards: sorted,
      label: `Full House de ${rankToString(trips)}s e ${rankToString(pair)}s`,
    };
  }

  // Flush
  if (isFlush) {
    const tb = ranks.slice(0, 5) as Rank[];
    return {
      category: 'flush',
      strength: packStrength('flush', tb),
      tiebreakers: tb,
      cards: sorted,
      label: `Flush até ${rankToString(tb[0])}`,
    };
  }

  // Straight
  if (straightHigh !== null) {
    const tb: Rank[] = [straightHigh, 0, 0, 0, 0] as Rank[];
    return {
      category: 'straight',
      strength: packStrength('straight', tb),
      tiebreakers: [straightHigh],
      cards: sorted,
      label: `Sequência até ${rankToString(straightHigh)}`,
    };
  }

  // Three of a kind
  if (groups[0][1] === 3) {
    const trips = groups[0][0];
    const kickers = ranks.filter((r) => r !== trips).slice(0, 2) as Rank[];
    const tb = [trips, kickers[0], kickers[1], 0, 0] as Rank[];
    return {
      category: 'threeOfAKind',
      strength: packStrength('threeOfAKind', tb),
      tiebreakers: [trips, ...kickers],
      cards: sorted,
      label: `Trinca de ${rankToString(trips)}s`,
    };
  }

  // Two pair
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const high = groups[0][0];
    const low = groups[1][0];
    const kicker = ranks.find((r) => r !== high && r !== low)! as Rank;
    const tb = [high, low, kicker, 0, 0] as Rank[];
    return {
      category: 'twoPair',
      strength: packStrength('twoPair', tb),
      tiebreakers: [high, low, kicker],
      cards: sorted,
      label: `Dois Pares (${rankToString(high)} e ${rankToString(low)})`,
    };
  }

  // Pair
  if (groups[0][1] === 2) {
    const pair = groups[0][0];
    const kickers = ranks.filter((r) => r !== pair).slice(0, 3) as Rank[];
    const tb = [pair, kickers[0], kickers[1], kickers[2], 0] as Rank[];
    return {
      category: 'pair',
      strength: packStrength('pair', tb),
      tiebreakers: [pair, ...kickers],
      cards: sorted,
      label: `Par de ${rankToString(pair)}s`,
    };
  }

  // High card
  const tb = ranks.slice(0, 5) as Rank[];
  return {
    category: 'highCard',
    strength: packStrength('highCard', tb),
    tiebreakers: tb,
    cards: sorted,
    label: `Carta Alta ${rankToString(tb[0])}`,
  };
}

/**
 * Evaluate the BEST 5-card hand from 5..7 cards.
 */
export function evaluateBestHand(cards: Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateBestHand expects 5..7 cards, got ${cards.length}`);
  }
  if (cards.length === 5) return evaluate5(cards);

  let best: HandRank | null = null;
  for (const combo of combinations(cards, 5)) {
    const r = evaluate5(combo);
    if (!best || r.strength > best.strength) best = r;
  }
  return best!;
}

export { CATEGORY_LABEL_PT };
