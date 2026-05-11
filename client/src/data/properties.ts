import type { PropertyTemplate } from '../types';

/**
 * Properties per city. Income scales with city size.
 * Type icons rendered as SVG in the UI.
 */
export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  // Coyote Bend (size 1)
  { id: 'cb-saloon', cityId: 'coyote-bend', name: 'Saloon do Olho-Cego', type: 'saloon', basePrice: 600, baseIncome: 28 },
  { id: 'cb-ranch', cityId: 'coyote-bend', name: 'Rancho do Junco', type: 'ranch', basePrice: 900, baseIncome: 42 },
  { id: 'cb-hotel', cityId: 'coyote-bend', name: 'Hospedaria Poeira-Vermelha', type: 'hotel', basePrice: 750, baseIncome: 36 },
  { id: 'cb-mine', cityId: 'coyote-bend', name: 'Mina Modesta de Cobre', type: 'mine', basePrice: 1100, baseIncome: 52 },
  { id: 'cb-ranch2', cityId: 'coyote-bend', name: 'Curral dos Sete Pilares', type: 'ranch', basePrice: 1300, baseIncome: 60 },

  // Saltwash (size 2)
  { id: 'sw-hotel', cityId: 'saltwash', name: 'Pensão Maré-Velha', type: 'hotel', basePrice: 1800, baseIncome: 95 },
  { id: 'sw-saloon', cityId: 'saltwash', name: 'Salão do Atracadouro', type: 'saloon', basePrice: 2200, baseIncome: 110 },
  { id: 'sw-theatre', cityId: 'saltwash', name: 'Teatrinho da Doca', type: 'theatre', basePrice: 2600, baseIncome: 132 },
  { id: 'sw-ranch', cityId: 'saltwash', name: 'Rancho do Sal', type: 'ranch', basePrice: 2000, baseIncome: 102 },

  // Ironvein (size 3)
  { id: 'iv-mine', cityId: 'ironvein', name: 'Mina do Veio Quente', type: 'mine', basePrice: 4500, baseIncome: 240 },
  { id: 'iv-saloon', cityId: 'ironvein', name: 'Saloon da Bigorna', type: 'saloon', basePrice: 3200, baseIncome: 170 },
  { id: 'iv-hotel', cityId: 'ironvein', name: 'Hotel Capataz', type: 'hotel', basePrice: 3800, baseIncome: 200 },
  { id: 'iv-rail', cityId: 'ironvein', name: 'Pátio de Cargas', type: 'rail', basePrice: 6000, baseIncome: 320 },
  { id: 'iv-mine2', cityId: 'ironvein', name: 'Mina Norte do Carvão', type: 'mine', basePrice: 5200, baseIncome: 280 },

  // Fairmount (size 4)
  { id: 'fm-theatre', cityId: 'fairmount', name: 'Teatro das Bétulas', type: 'theatre', basePrice: 9000, baseIncome: 460 },
  { id: 'fm-rail', cityId: 'fairmount', name: 'Pátio Ferroviário', type: 'rail', basePrice: 12000, baseIncome: 620 },
  { id: 'fm-hotel', cityId: 'fairmount', name: 'Hotel Avenida', type: 'hotel', basePrice: 7500, baseIncome: 380 },
  { id: 'fm-saloon', cityId: 'fairmount', name: 'Saloon Praça Central', type: 'saloon', basePrice: 6800, baseIncome: 345 },
  { id: 'fm-ranch', cityId: 'fairmount', name: 'Fazenda Erva-Doce', type: 'ranch', basePrice: 8200, baseIncome: 420 },

  // Duskhollow (size 3)
  { id: 'dh-mine', cityId: 'duskhollow', name: 'Mina do Crepúsculo', type: 'mine', basePrice: 5800, baseIncome: 305 },
  { id: 'dh-saloon', cityId: 'duskhollow', name: 'Saloon Lanterna', type: 'saloon', basePrice: 4400, baseIncome: 230 },
  { id: 'dh-hotel', cityId: 'duskhollow', name: 'Hotel Sombra-Longa', type: 'hotel', basePrice: 5000, baseIncome: 262 },
  { id: 'dh-theatre', cityId: 'duskhollow', name: 'Casa de Ópera Negra', type: 'theatre', basePrice: 6400, baseIncome: 335 },

  // Goldspur (size 4)
  { id: 'gs-mine', cityId: 'goldspur', name: 'Mina Veio-de-Ouro', type: 'mine', basePrice: 14000, baseIncome: 780 },
  { id: 'gs-theatre', cityId: 'goldspur', name: 'Teatro Estrela', type: 'theatre', basePrice: 11000, baseIncome: 580 },
  { id: 'gs-hotel', cityId: 'goldspur', name: 'Hotel Continental', type: 'hotel', basePrice: 16000, baseIncome: 880 },
  { id: 'gs-saloon', cityId: 'goldspur', name: 'Saloon Coroa de Ouro', type: 'saloon', basePrice: 10500, baseIncome: 555 },
  { id: 'gs-rail', cityId: 'goldspur', name: 'Estação de Cargas Áurea', type: 'rail', basePrice: 18500, baseIncome: 990 },

  // Silverline (size 5)
  { id: 'sl-rail', cityId: 'silverline', name: 'Estação Norte', type: 'rail', basePrice: 28000, baseIncome: 1500 },
  { id: 'sl-theatre', cityId: 'silverline', name: 'Teatro Imperial', type: 'theatre', basePrice: 22000, baseIncome: 1180 },
  { id: 'sl-hotel', cityId: 'silverline', name: 'Hotel Excelsior', type: 'hotel', basePrice: 26000, baseIncome: 1380 },
  { id: 'sl-saloon', cityId: 'silverline', name: 'Saloon Espelho-Liso', type: 'saloon', basePrice: 19500, baseIncome: 1030 },
  { id: 'sl-mine', cityId: 'silverline', name: 'Mina Veta-Branca', type: 'mine', basePrice: 24000, baseIncome: 1270 },

  // Corazón (size 5)
  { id: 'co-saloon', cityId: 'corazon', name: 'Saloon Carmim', type: 'saloon', basePrice: 36000, baseIncome: 1900 },
  { id: 'co-theatre', cityId: 'corazon', name: 'Grande Teatro Corazón', type: 'theatre', basePrice: 48000, baseIncome: 2480 },
  { id: 'co-hotel', cityId: 'corazon', name: 'Hotel Veludo', type: 'hotel', basePrice: 55000, baseIncome: 2900 },
  { id: 'co-rail', cityId: 'corazon', name: 'Terminal Capital', type: 'rail', basePrice: 72000, baseIncome: 3800 },
  { id: 'co-ranch', cityId: 'corazon', name: 'Estância Coração-Vermelho', type: 'ranch', basePrice: 42000, baseIncome: 2210 },
  { id: 'co-saloon2', cityId: 'corazon', name: 'Cassino Boca-da-Noite', type: 'saloon', basePrice: 62000, baseIncome: 3260 },
];

/** Multiplier per upgrade level for income & sale value. */
export const LEVEL_MULTIPLIERS = [1, 1.5, 2.2, 3.2] as const;

export function upgradeCost(template: PropertyTemplate, level: 0 | 1 | 2 | 3): number {
  if (level >= 3) return Infinity;
  // Each level costs 60% of base price compounded
  return Math.round(template.basePrice * 0.6 * (level + 1));
}

export function propertiesForCity(cityId: string): PropertyTemplate[] {
  return PROPERTY_TEMPLATES.filter((p) => p.cityId === cityId);
}
