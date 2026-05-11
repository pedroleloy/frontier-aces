import type { City } from '../types';

/**
 * Eight original cities for the Frontier Aces map.
 *
 * Names are invented (not real US towns), evoking western flavor:
 *  - Coyote Bend, Saltwash, Ironvein...
 *
 * Coordinates are normalized to a 1000x600 viewBox.
 */
export const CITIES: City[] = [
  {
    id: 'coyote-bend',
    name: 'Coyote Bend',
    flavor: 'Vilarejo modesto à beira do rio. Mesas baratas, ar empoeirado.',
    position: { x: 180, y: 460 },
    unlock: { reputation: 0 },
    blindLevels: [
      { sb: 1, bb: 2, label: 'Mesa do Cavalariço' },
      { sb: 5, bb: 10, label: 'Mesa do Mercador' },
    ],
    size: 1,
  },
  {
    id: 'saltwash',
    name: 'Saltwash',
    flavor: 'Cidade portuária seca. O sal cobre tudo, inclusive a mentira no olhar.',
    position: { x: 320, y: 520 },
    unlock: { reputation: 50 },
    blindLevels: [
      { sb: 5, bb: 10, label: 'Salão do Cais' },
      { sb: 10, bb: 25, label: 'Mesa do Capitão' },
    ],
    size: 2,
  },
  {
    id: 'ironvein',
    name: 'Ironvein',
    flavor: 'Cidade-mineradora. Bolsos pesados, paciência curta.',
    position: { x: 460, y: 360 },
    unlock: { reputation: 120, bankroll: 500 },
    blindLevels: [
      { sb: 10, bb: 25, label: 'Mesa do Capataz' },
      { sb: 25, bb: 50, label: 'Mesa da Forja' },
    ],
    size: 3,
  },
  {
    id: 'fairmount',
    name: 'Fairmount',
    flavor: 'Cidade ferroviária. Paletós engomados, blefes finos.',
    position: { x: 600, y: 280 },
    unlock: { reputation: 250, bankroll: 1500 },
    blindLevels: [
      { sb: 25, bb: 50, label: 'Hotel das Bétulas' },
      { sb: 50, bb: 100, label: 'Salão de Fairmount' },
    ],
    size: 4,
  },
  {
    id: 'duskhollow',
    name: 'Duskhollow',
    flavor: 'Cidade vale, sempre em sombra. Quem joga aqui não tem medo do escuro.',
    position: { x: 720, y: 470 },
    unlock: { reputation: 380 },
    blindLevels: [
      { sb: 50, bb: 100, label: 'Mesa do Crepúsculo' },
      { sb: 100, bb: 200, label: 'Mesa da Lanterna' },
    ],
    size: 3,
  },
  {
    id: 'goldspur',
    name: 'Goldspur',
    flavor: 'Boomtown do ouro. Apostas alucinantes, chips voando.',
    position: { x: 540, y: 160 },
    unlock: { reputation: 520, bankroll: 5000 },
    blindLevels: [
      { sb: 100, bb: 200, label: 'Mesa do Veio' },
      { sb: 250, bb: 500, label: 'Mesa do Caçador' },
    ],
    size: 4,
  },
  {
    id: 'silverline',
    name: 'Silverline',
    flavor: 'Cidade ferroviária do norte. Trilhos brilham como prata.',
    position: { x: 820, y: 220 },
    unlock: { reputation: 700, bankroll: 12000 },
    blindLevels: [
      { sb: 250, bb: 500, label: 'Salão da Estação' },
      { sb: 500, bb: 1000, label: 'Mesa do Trem da Meia-Noite' },
    ],
    size: 5,
  },
  {
    id: 'corazon',
    name: 'Corazón',
    flavor: 'A capital. Cassinos cobertos de veludo. Lendas se cruzam aqui.',
    position: { x: 880, y: 420 },
    unlock: { reputation: 900, bankroll: 50000 },
    blindLevels: [
      { sb: 500, bb: 1000, label: 'Salão Central' },
      { sb: 1000, bb: 2000, label: 'Mesa Carmim' },
      { sb: 2500, bb: 5000, label: 'Mesa dos Lendários' },
    ],
    size: 5,
  },
];

/** Edges between cities — for travel routing on the map. */
export const ROUTES: { a: string; b: string; cost: number }[] = [
  { a: 'coyote-bend', b: 'saltwash', cost: 5 },
  { a: 'coyote-bend', b: 'ironvein', cost: 12 },
  { a: 'saltwash', b: 'ironvein', cost: 15 },
  { a: 'saltwash', b: 'duskhollow', cost: 25 },
  { a: 'ironvein', b: 'fairmount', cost: 20 },
  { a: 'ironvein', b: 'goldspur', cost: 30 },
  { a: 'fairmount', b: 'goldspur', cost: 25 },
  { a: 'fairmount', b: 'silverline', cost: 40 },
  { a: 'duskhollow', b: 'fairmount', cost: 35 },
  { a: 'duskhollow', b: 'corazon', cost: 60 },
  { a: 'goldspur', b: 'silverline', cost: 35 },
  { a: 'silverline', b: 'corazon', cost: 50 },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function routeCost(a: string, b: string): number {
  const r = ROUTES.find(
    (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
  );
  return r?.cost ?? 999;
}

export function neighborsOf(cityId: string): string[] {
  return ROUTES.filter((r) => r.a === cityId || r.b === cityId).map((r) =>
    r.a === cityId ? r.b : r.a,
  );
}
