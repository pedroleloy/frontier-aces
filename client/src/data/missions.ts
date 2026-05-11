import type { Achievement, Mission } from '../types';

export const MISSION_POOL: Omit<Mission, 'id' | 'progress' | 'completed'>[] = [
  {
    title: 'Mãos da Madrugada',
    description: 'Vença 3 mãos hoje.',
    goal: 3,
    reward: { gold: 100, xp: 25 },
    type: 'handsWon',
  },
  {
    title: 'Mestre do Pote',
    description: 'Ganhe um pote de pelo menos $300.',
    goal: 300,
    reward: { gold: 250, xp: 40, reputation: 5 },
    type: 'bigPot',
  },
  {
    title: 'Estrada Aberta',
    description: 'Visite uma cidade nova.',
    goal: 1,
    reward: { gold: 75, xp: 30, reputation: 10 },
    type: 'travelTo',
  },
  {
    title: 'Capitalista da Fronteira',
    description: 'Compre uma propriedade.',
    goal: 1,
    reward: { gold: 0, xp: 50, reputation: 15 },
    type: 'buyProperty',
  },
  {
    title: 'Sequência Vencedora',
    description: 'Vença 7 mãos hoje.',
    goal: 7,
    reward: { gold: 300, xp: 70 },
    type: 'handsWon',
  },
  {
    title: 'O Bote',
    description: 'Ganhe um pote de pelo menos $1000.',
    goal: 1000,
    reward: { gold: 600, xp: 90, reputation: 15 },
    type: 'bigPot',
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-hand-won', title: 'Primeira Mão', description: 'Vença sua primeira mão.', unlocked: false },
  { id: 'first-property', title: 'Pequeno Proprietário', description: 'Compre sua primeira propriedade.', unlocked: false },
  { id: 'high-roller', title: 'Apostador Pesado', description: 'Tenha um bankroll de $10.000.', unlocked: false },
  { id: 'tycoon', title: 'Magnata da Fronteira', description: 'Possua 5 propriedades.', unlocked: false },
  { id: 'gambler', title: 'Apostador', description: 'Suba de Drifter para Gambler.', unlocked: false },
  { id: 'high-roller-tier', title: 'Tier High Roller', description: 'Atinja a reputação High Roller.', unlocked: false },
  { id: 'legend', title: 'Lenda da Fronteira', description: 'Atinja a reputação Lenda.', unlocked: false },
  { id: 'cross-frontier', title: 'Atravessou a Fronteira', description: 'Visite todas as 8 cidades.', unlocked: false },
  { id: 'royal-flush', title: 'Realeza', description: 'Vença com Royal Flush.', unlocked: false },
  { id: 'all-in-survivor', title: 'Sobrevivente', description: 'Vença um pote indo all-in.', unlocked: false },
  { id: 'big-pot', title: 'Pote Grande', description: 'Ganhe um pote de $5.000.', unlocked: false },
  { id: 'huge-pot', title: 'Pote Enorme', description: 'Ganhe um pote de $20.000.', unlocked: false },
  { id: 'streak-3', title: 'Sequência de 3', description: 'Vença 3 mãos consecutivas.', unlocked: false },
  { id: 'streak-7', title: 'Sequência de 7', description: 'Vença 7 mãos consecutivas.', unlocked: false },
  { id: 'mansion', title: 'Mansão', description: 'Tenha uma propriedade nível 3.', unlocked: false },
  { id: 'tournament-1', title: 'Primeiro Torneio', description: 'Vença um torneio.', unlocked: false },
  { id: 'rich-50k', title: '$50.000', description: 'Tenha bankroll de $50.000.', unlocked: false },
  { id: 'rich-200k', title: '$200.000', description: 'Tenha bankroll de $200.000.', unlocked: false },
  { id: 'frontier-master', title: 'Mestre da Fronteira', description: 'Desbloqueie tudo no jogo.', unlocked: false },
  { id: 'comeback', title: 'A Volta por Cima', description: 'Recupere-se de menos de $50.', unlocked: false },
];
