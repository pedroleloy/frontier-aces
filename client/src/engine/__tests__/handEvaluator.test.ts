import { describe, it, expect } from 'vitest';
import { evaluateBestHand } from '../handEvaluator';
import type { Card, Rank } from '../../types';

const c = (rank: Rank, suit: Card['suit']): Card => ({ rank, suit });

describe('handEvaluator', () => {
  it('detects royal flush', () => {
    const hand = evaluateBestHand([
      c(14, 'spades'), c(13, 'spades'), c(12, 'spades'),
      c(11, 'spades'), c(10, 'spades'), c(2, 'hearts'), c(3, 'clubs'),
    ]);
    expect(hand.category).toBe('straightFlush');
    expect(hand.tiebreakers[0]).toBe(14);
  });

  it('detects straight flush (non-royal)', () => {
    const hand = evaluateBestHand([
      c(9, 'hearts'), c(8, 'hearts'), c(7, 'hearts'),
      c(6, 'hearts'), c(5, 'hearts'), c(2, 'clubs'), c(14, 'spades'),
    ]);
    expect(hand.category).toBe('straightFlush');
    expect(hand.tiebreakers[0]).toBe(9);
  });

  it('detects wheel straight flush (A-2-3-4-5)', () => {
    const hand = evaluateBestHand([
      c(14, 'clubs'), c(2, 'clubs'), c(3, 'clubs'),
      c(4, 'clubs'), c(5, 'clubs'), c(13, 'hearts'), c(7, 'spades'),
    ]);
    expect(hand.category).toBe('straightFlush');
    expect(hand.tiebreakers[0]).toBe(5);
  });

  it('detects four of a kind with kicker', () => {
    const hand = evaluateBestHand([
      c(8, 'hearts'), c(8, 'diamonds'), c(8, 'clubs'),
      c(8, 'spades'), c(13, 'hearts'), c(2, 'clubs'), c(5, 'spades'),
    ]);
    expect(hand.category).toBe('fourOfAKind');
    expect(hand.tiebreakers).toEqual([8, 13]);
  });

  it('detects full house picking the highest trips', () => {
    const hand = evaluateBestHand([
      c(7, 'hearts'), c(7, 'diamonds'),
      c(9, 'clubs'), c(9, 'spades'), c(9, 'hearts'),
      c(2, 'clubs'), c(3, 'spades'),
    ]);
    expect(hand.category).toBe('fullHouse');
    expect(hand.tiebreakers).toEqual([9, 7]);
  });

  it('detects flush', () => {
    const hand = evaluateBestHand([
      c(2, 'spades'), c(7, 'spades'), c(9, 'spades'),
      c(11, 'spades'), c(13, 'spades'), c(3, 'clubs'), c(4, 'hearts'),
    ]);
    expect(hand.category).toBe('flush');
    expect(hand.tiebreakers).toEqual([13, 11, 9, 7, 2]);
  });

  it('detects straight', () => {
    const hand = evaluateBestHand([
      c(5, 'hearts'), c(6, 'diamonds'), c(7, 'clubs'),
      c(8, 'spades'), c(9, 'hearts'), c(2, 'clubs'), c(13, 'spades'),
    ]);
    expect(hand.category).toBe('straight');
    expect(hand.tiebreakers[0]).toBe(9);
  });

  it('detects wheel straight (A-2-3-4-5)', () => {
    const hand = evaluateBestHand([
      c(14, 'hearts'), c(2, 'diamonds'), c(3, 'clubs'),
      c(4, 'spades'), c(5, 'hearts'), c(8, 'clubs'), c(13, 'spades'),
    ]);
    expect(hand.category).toBe('straight');
    expect(hand.tiebreakers[0]).toBe(5);
  });

  it('detects three of a kind with two kickers', () => {
    const hand = evaluateBestHand([
      c(11, 'hearts'), c(11, 'diamonds'), c(11, 'clubs'),
      c(2, 'spades'), c(7, 'hearts'), c(13, 'clubs'), c(4, 'spades'),
    ]);
    expect(hand.category).toBe('threeOfAKind');
    expect(hand.tiebreakers).toEqual([11, 13, 7]);
  });

  it('detects two pair with kicker', () => {
    const hand = evaluateBestHand([
      c(10, 'hearts'), c(10, 'diamonds'),
      c(7, 'clubs'), c(7, 'spades'),
      c(2, 'hearts'), c(3, 'clubs'), c(14, 'spades'),
    ]);
    expect(hand.category).toBe('twoPair');
    expect(hand.tiebreakers).toEqual([10, 7, 14]);
  });

  it('detects pair with three kickers', () => {
    const hand = evaluateBestHand([
      c(10, 'hearts'), c(10, 'diamonds'),
      c(2, 'clubs'), c(7, 'spades'),
      c(13, 'hearts'), c(3, 'clubs'), c(11, 'spades'),
    ]);
    expect(hand.category).toBe('pair');
    expect(hand.tiebreakers).toEqual([10, 13, 11, 7]);
  });

  it('detects high card', () => {
    const hand = evaluateBestHand([
      c(2, 'hearts'), c(5, 'diamonds'),
      c(7, 'clubs'), c(9, 'spades'),
      c(11, 'hearts'), c(13, 'clubs'), c(14, 'spades'),
    ]);
    expect(hand.category).toBe('highCard');
    expect(hand.tiebreakers).toEqual([14, 13, 11, 9, 7]);
  });

  it('compares strengths transitively', () => {
    const flush = evaluateBestHand([
      c(2, 'spades'), c(7, 'spades'), c(9, 'spades'),
      c(11, 'spades'), c(13, 'spades'), c(3, 'clubs'), c(4, 'hearts'),
    ]);
    const fullHouse = evaluateBestHand([
      c(9, 'hearts'), c(9, 'diamonds'), c(9, 'clubs'),
      c(7, 'spades'), c(7, 'hearts'), c(2, 'clubs'), c(3, 'spades'),
    ]);
    expect(fullHouse.strength).toBeGreaterThan(flush.strength);
  });

  it('compares two pair by higher pair, then lower pair, then kicker', () => {
    const a = evaluateBestHand([
      c(10, 'hearts'), c(10, 'diamonds'),
      c(7, 'clubs'), c(7, 'spades'),
      c(14, 'hearts'), c(2, 'clubs'), c(3, 'spades'),
    ]);
    const b = evaluateBestHand([
      c(10, 'hearts'), c(10, 'spades'),
      c(7, 'clubs'), c(7, 'diamonds'),
      c(13, 'hearts'), c(2, 'clubs'), c(3, 'spades'),
    ]);
    expect(a.strength).toBeGreaterThan(b.strength);
  });
});
