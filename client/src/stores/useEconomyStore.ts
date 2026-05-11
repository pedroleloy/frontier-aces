import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EconomyState, Property, Transaction } from '../types';
import { LEVEL_MULTIPLIERS, PROPERTY_TEMPLATES, upgradeCost } from '../data/properties';

/* -----------------------------------------------------------------------------
 * SELIC daily interest on bank deposits
 *
 * Reference rate as of May 2026: 14,75% a.a. (post-COPOM cut to 14.50% on
 * 29/Apr/2026, with another decision in early May). We use the conservative
 * 14,75% nominal annual rate compounded daily (252 business days, matching
 * how the actual SELIC is annualized in Brazilian fixed income).
 *
 *   (1 + 0.1475)^(1/252) - 1  ≈  0.000545 / dia útil  (~0.0545% ao dia)
 *
 * In-game days are calendar-like (you "sleep" once per stop in a city), so
 * each in-game day counts as one compounding period. Easy to tune later — if
 * you want the equivalent calendar-day rate instead use:
 *   (1 + 0.1475)^(1/365) - 1  ≈  0.000377 / dia
 * --------------------------------------------------------------------------- */
export const SELIC_ANNUAL_RATE = 0.1475;
export const SELIC_DAILY_RATE = Math.pow(1 + SELIC_ANNUAL_RATE, 1 / 252) - 1;

export interface DailyIncomeResult {
  propertyIncome: number;
  bankInterest: number;
}

interface EconomyStore extends EconomyState {
  addMoney: (amount: number, category: Transaction['category'], note: string) => void;
  removeMoney: (amount: number, category: Transaction['category'], note: string) => boolean;
  depositToBank: (amount: number) => boolean;
  withdrawFromBank: (amount: number) => boolean;
  buyProperty: (propertyId: string) => boolean;
  sellProperty: (propertyId: string) => number;
  upgradeProperty: (propertyId: string) => boolean;
  loseProperty: (propertyId: string) => void;
  collectDailyIncome: () => DailyIncomeResult;
  reset: () => void;
}

const INITIAL: EconomyState = {
  bankroll: 200,
  bank: 0,
  properties: PROPERTY_TEMPLATES.map<Property>((tpl) => ({
    ...tpl,
    level: 0,
    ownerId: null,
  })),
  inGameDay: 1,
  transactions: [],
};

function makeTx(amount: number, category: Transaction['category'], note: string): Transaction {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    amount,
    category,
    note,
  };
}

export const useEconomyStore = create<EconomyStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      addMoney: (amount, category, note) =>
        set((s) => ({
          bankroll: s.bankroll + amount,
          transactions: [makeTx(amount, category, note), ...s.transactions].slice(0, 100),
        })),
      removeMoney: (amount, category, note) => {
        const s = get();
        if (s.bankroll < amount) return false;
        set((st) => ({
          bankroll: st.bankroll - amount,
          transactions: [makeTx(-amount, category, note), ...st.transactions].slice(0, 100),
        }));
        return true;
      },
      depositToBank: (amount) => {
        const s = get();
        if (s.bankroll < amount || amount <= 0) return false;
        set((st) => ({
          bankroll: st.bankroll - amount,
          bank: st.bank + amount,
          transactions: [makeTx(-amount, 'shop', 'Depósito no banco'), ...st.transactions].slice(0, 100),
        }));
        return true;
      },
      withdrawFromBank: (amount) => {
        const s = get();
        if (s.bank < amount || amount <= 0) return false;
        set((st) => ({
          bankroll: st.bankroll + amount,
          bank: st.bank - amount,
          transactions: [makeTx(amount, 'shop', 'Saque do banco'), ...st.transactions].slice(0, 100),
        }));
        return true;
      },
      buyProperty: (propertyId) => {
        const s = get();
        const prop = s.properties.find((p) => p.id === propertyId);
        if (!prop || prop.ownerId === 'hero') return false;
        const price = prop.basePrice;
        if (s.bankroll < price) return false;
        set((st) => ({
          bankroll: st.bankroll - price,
          properties: st.properties.map((p) =>
            p.id === propertyId ? { ...p, ownerId: 'hero' } : p,
          ),
          transactions: [
            makeTx(-price, 'property', `Compra: ${prop.name}`),
            ...st.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      sellProperty: (propertyId) => {
        const s = get();
        const prop = s.properties.find((p) => p.id === propertyId);
        if (!prop || prop.ownerId !== 'hero') return 0;
        // Sell at 70% of upgraded value
        const value = Math.round(prop.basePrice * LEVEL_MULTIPLIERS[prop.level] * 0.7);
        set((st) => ({
          bankroll: st.bankroll + value,
          properties: st.properties.map((p) =>
            p.id === propertyId ? { ...p, ownerId: null, level: 0 } : p,
          ),
          transactions: [
            makeTx(value, 'property', `Venda: ${prop.name}`),
            ...st.transactions,
          ].slice(0, 100),
        }));
        return value;
      },
      upgradeProperty: (propertyId) => {
        const s = get();
        const prop = s.properties.find((p) => p.id === propertyId);
        if (!prop || prop.ownerId !== 'hero' || prop.level >= 3) return false;
        const cost = upgradeCost(prop, prop.level);
        if (s.bankroll < cost) return false;
        set((st) => ({
          bankroll: st.bankroll - cost,
          properties: st.properties.map((p) =>
            p.id === propertyId ? { ...p, level: (p.level + 1) as 0 | 1 | 2 | 3 } : p,
          ),
          transactions: [
            makeTx(-cost, 'property', `Melhoria: ${prop.name}`),
            ...st.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
      loseProperty: (propertyId) =>
        set((st) => ({
          properties: st.properties.map((p) =>
            p.id === propertyId ? { ...p, ownerId: 'rival', level: 0 } : p,
          ),
          transactions: [
            makeTx(0, 'property', `Perdida: ${st.properties.find((p) => p.id === propertyId)?.name ?? ''}`),
            ...st.transactions,
          ].slice(0, 100),
        })),
      collectDailyIncome: () => {
        const s = get();
        const heroProps = s.properties.filter((p) => p.ownerId === 'hero');
        const propertyIncome = heroProps.reduce(
          (sum, p) => sum + Math.round(p.baseIncome * LEVEL_MULTIPLIERS[p.level]),
          0,
        );
        // SELIC compounds on the bank balance. Round to whole units to match
        // the rest of the economy's display granularity.
        const bankInterest = Math.round(s.bank * SELIC_DAILY_RATE);
        const nextDay = s.inGameDay + 1;

        set((st) => {
          const newTxs: Transaction[] = [];
          if (propertyIncome > 0) {
            newTxs.push(makeTx(propertyIncome, 'property', `Renda diária (Dia ${nextDay})`));
          }
          if (bankInterest > 0) {
            newTxs.push(
              makeTx(
                bankInterest,
                'shop',
                `Juros SELIC (${(SELIC_ANNUAL_RATE * 100).toFixed(2)}% a.a.)`,
              ),
            );
          }
          return {
            bankroll: st.bankroll + propertyIncome,
            bank: st.bank + bankInterest,
            inGameDay: nextDay,
            transactions: [...newTxs, ...st.transactions].slice(0, 100),
          };
        });

        return { propertyIncome, bankInterest };
      },
      reset: () => set(INITIAL),
    }),
    {
      name: 'frontier-aces:economy',
      version: 2,
      /**
       * Migration: when new PROPERTY_TEMPLATES are added (e.g. v0.2 expanded
       * the catalog from 22 to 45 listings), existing localStorage saves still
       * carry the old, smaller `properties` array. We merge any missing
       * template into the saved state without disturbing the player's
       * ownership/level on existing ones.
       */
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<EconomyState> | undefined;
        if (!state) return state as unknown as EconomyState;
        const saved = state.properties ?? [];
        const savedById = new Map(saved.map((p) => [p.id, p]));
        const merged: Property[] = PROPERTY_TEMPLATES.map((tpl) => {
          const existing = savedById.get(tpl.id);
          if (existing) return { ...tpl, level: existing.level, ownerId: existing.ownerId };
          return { ...tpl, level: 0, ownerId: null };
        });
        return { ...state, properties: merged } as EconomyState;
      },
    },
  ),
);
