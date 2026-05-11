import type { Card, Rank, Suit } from '../types';

/* -----------------------------------------------------------------------------
 * Deterministic PRNG — Mulberry32
 *
 * We need shuffles to be reproducible (for unit tests and replay debugging),
 * but unguessable enough that a single-player human can't predict cards
 * by reading source. We seed from `crypto.getRandomValues` at table creation.
 * --------------------------------------------------------------------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}

/* -------------------------------------------------------------------------- */
/* Deck                                                                        */
/* -------------------------------------------------------------------------- */

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle with a seeded PRNG.
 * Returns a NEW array — does not mutate the input.
 */
export function shuffle<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newShuffledDeck(seed = randomSeed()): { deck: Card[]; seed: number } {
  return { deck: shuffle(makeDeck(), seed), seed };
}

export function rankToString(r: Rank): string {
  if (r <= 10) return String(r);
  const map: Record<11 | 12 | 13 | 14, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  return map[r as 11 | 12 | 13 | 14];
}

export function suitSymbol(s: Suit): string {
  return ({ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' } as const)[s];
}

export function cardLabel(c: Card): string {
  return `${rankToString(c.rank)}${suitSymbol(c.suit)}`;
}
