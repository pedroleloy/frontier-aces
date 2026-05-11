/**
 * Frontier Aces — shared type definitions.
 *
 * Keep this file dependency-free so engine, stores and UI can all import safely.
 */

// ===== Cards =====
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/** 2..14 — 11=J, 12=Q, 13=K, 14=A */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

// ===== Hand evaluation =====
export type HandCategory =
  | 'highCard'
  | 'pair'
  | 'twoPair'
  | 'threeOfAKind'
  | 'straight'
  | 'flush'
  | 'fullHouse'
  | 'fourOfAKind'
  | 'straightFlush';

export interface HandRank {
  category: HandCategory;
  /** Numeric strength — higher is better. Ties go to `tiebreakers`. */
  strength: number;
  /** Decreasing list of ranks used to settle ties (e.g. kickers). */
  tiebreakers: Rank[];
  cards: Card[]; // The 5 cards forming the hand
  label: string; // Human readable, e.g. "Trinca de Reis"
}

// ===== Poker engine =====
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'idle';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface Action {
  playerId: string;
  type: ActionType;
  amount?: number;
  street: Street;
}

export type AIPersonality =
  | 'tightPassive'
  | 'tightAggressive'
  | 'loosePassive'
  | 'looseAggressive'
  | 'maniac';

export interface PlayerSeat {
  id: string;
  name: string;
  chips: number;
  hole: [Card, Card] | null;
  isHero: boolean;
  personality?: AIPersonality;
  status: 'active' | 'folded' | 'allin' | 'sittingOut' | 'busted';
  /** Total chips put in the pot during the *current* street. */
  currentBet: number;
  /** Total chips put in the pot for the entire hand (used for side pots). */
  totalCommitted: number;
  hasActedThisStreet: boolean;
  /** Avatar seed string used by SVG renderer to deterministically pick traits. */
  avatarSeed: string;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface TableState {
  id: string;
  players: PlayerSeat[];
  community: Card[];
  pot: number;
  sidePots: SidePot[];
  street: Street;
  /** Index of player whose turn it is. */
  toAct: number;
  dealerIndex: number;
  blinds: { sb: number; bb: number; ante?: number };
  currentBet: number; // To call this street
  minRaise: number;
  history: Action[];
  /** Showdown info populated only when street === 'showdown'. */
  result?: ShowdownResult;
  /** Random seed used for deck shuffle (for replays/tests). */
  seed: number;
  /** Remaining cards in the deck (for dealing additional streets). */
  deck: Card[];
}

export interface ShowdownResult {
  winners: { playerId: string; amount: number; hand: HandRank | null }[];
  reveals: { playerId: string; hole: [Card, Card]; hand: HandRank }[];
}

// ===== Cities & map =====
export interface City {
  id: string;
  name: string;
  flavor: string;
  position: { x: number; y: number }; // SVG coordinates 0..1000
  unlock: { reputation: number; bankroll?: number };
  blindLevels: { sb: number; bb: number; label: string }[];
  // 1 = small frontier town, 5 = big railroad city
  size: 1 | 2 | 3 | 4 | 5;
}

// ===== Properties =====
export interface PropertyTemplate {
  id: string;
  cityId: string;
  name: string;
  type: 'saloon' | 'hotel' | 'mine' | 'ranch' | 'theatre' | 'rail';
  basePrice: number;
  /** Income per in-game day, before upgrades. */
  baseIncome: number;
}

export interface Property extends PropertyTemplate {
  level: 0 | 1 | 2 | 3;
  ownerId: 'hero' | 'rival' | null;
  rivalAskingPrice?: number; // If owned by a rival
}

// ===== Player profile =====
export type ReputationTier = 'drifter' | 'gambler' | 'highRoller' | 'legend';

export interface PlayerProfile {
  id: string;
  name: string;
  avatarSeed: string;
  level: number;
  xp: number;
  reputation: number; // 0..1000
  tier: ReputationTier;
  stats: {
    handsPlayed: number;
    handsWon: number;
    showdownsWon: number;
    biggestPot: number;
    tournamentsWon: number;
  };
}

// ===== Economy =====
export interface Transaction {
  id: string;
  at: number;
  amount: number; // signed (positive = income)
  category: 'poker' | 'property' | 'travel' | 'shop' | 'event' | 'mission';
  note: string;
}

export interface EconomyState {
  bankroll: number;
  bank: number;            // money kept safely at the bank (cannot be lost in cash games)
  properties: Property[];
  inGameDay: number;
  transactions: Transaction[];
}

// ===== Map =====
export interface MapState {
  currentCityId: string;
  unlockedCityIds: string[];
  travel: {
    fromCityId: string;
    toCityId: string;
    progress: number; // 0..1
  } | null;
  /** Active travel event (e.g. roadside robber) waiting for player input. */
  activeEvent: TravelEvent | null;
}

export type TravelEvent =
  | { kind: 'lucky'; gold: number; description: string }
  | { kind: 'trouble'; cost: number; description: string }
  | { kind: 'wager'; description: string; stake: number };

// ===== Mission & achievements =====
export interface Mission {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  reward: { gold: number; xp: number; reputation?: number };
  completed: boolean;
  type: 'handsWon' | 'bigPot' | 'travelTo' | 'buyProperty' | 'tournament';
  param?: string | number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

// ===== Save format =====
export interface SaveSlot {
  version: 1;
  createdAt: number;
  updatedAt: number;
  player: PlayerProfile;
  economy: EconomyState;
  map: MapState;
  missions: Mission[];
  achievements: string[]; // ids unlocked
}
