import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/hud/TopBar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { findCity } from '../data/cities';
import { LEVEL_MULTIPLIERS, upgradeCost } from '../data/properties';
import { useEconomyStore } from '../stores/useEconomyStore';
import { useMapStore } from '../stores/useMapStore';
import { formatMoney } from '../utils/format';
import { audio } from '../services/audio';
import type { Property } from '../types';

interface Props {
  onBack: () => void;
}

const TYPE_ICON: Record<Property['type'], string> = {
  saloon: '🍺',
  hotel: '🛏',
  mine: '⛏',
  ranch: '🐂',
  theatre: '🎭',
  rail: '🚂',
};

const TYPE_LABEL: Record<Property['type'], string> = {
  saloon: 'Saloon',
  hotel: 'Hotel',
  mine: 'Mina',
  ranch: 'Rancho',
  theatre: 'Teatro',
  rail: 'Ferrovia',
};

export function PropertyScreen({ onBack }: Props) {
  const cityId = useMapStore((s) => s.currentCityId);
  const properties = useEconomyStore((s) => s.properties);
  const buyProperty = useEconomyStore((s) => s.buyProperty);
  const sellProperty = useEconomyStore((s) => s.sellProperty);
  const upgradeProperty = useEconomyStore((s) => s.upgradeProperty);
  const bankroll = useEconomyStore((s) => s.bankroll);

  const city = findCity(cityId)!;
  const localProps = properties.filter((p) => p.cityId === cityId);

  const [actionResult, setActionResult] = useState<string | null>(null);

  function handleBuy(p: Property) {
    if (buyProperty(p.id)) {
      audio.play('cash');
      setActionResult(`Você comprou ${p.name} por ${formatMoney(p.basePrice)}.`);
    } else {
      setActionResult('Não foi possível comprar (saldo insuficiente?).');
    }
  }
  function handleSell(p: Property) {
    const value = sellProperty(p.id);
    if (value > 0) {
      audio.play('cash');
      setActionResult(`Você vendeu ${p.name} por ${formatMoney(value)}.`);
    } else {
      setActionResult('Não foi possível vender.');
    }
  }
  function handleUpgrade(p: Property) {
    if (upgradeProperty(p.id)) {
      audio.play('chipStack');
      setActionResult(`${p.name} melhorada para nível ${p.level + 1}.`);
    } else {
      setActionResult('Não foi possível melhorar (já no nível máximo ou saldo insuficiente).');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 px-4 py-2 flex flex-col gap-3">
        <div className="frame-bronze p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl tracking-wider text-parchment-50">
              Cartório de {city.name}
            </h1>
            <p className="text-sm text-parchment-200">
              Compre imóveis para gerar renda diária. Melhore-os para multiplicar lucros.
            </p>
          </div>
          <Button variant="ghost" onClick={onBack}>
            ← Voltar à cidade
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {localProps.map((p) => {
            const owned = p.ownerId === 'hero';
            const taken = p.ownerId === 'rival';
            const income = Math.round(p.baseIncome * LEVEL_MULTIPLIERS[p.level]);
            const sellValue = Math.round(
              p.basePrice * LEVEL_MULTIPLIERS[p.level] * 0.7,
            );
            const upgrade = p.level < 3 ? upgradeCost(p, p.level) : null;
            return (
              <motion.div
                key={p.id}
                className={`frame-bronze p-4 flex flex-col gap-2 ${
                  owned ? 'ring-1 ring-bronze-300/50' : taken ? 'opacity-60' : ''
                }`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: taken ? 0.6 : 1 }}
              >
                <div className="flex items-start gap-2">
                  <div className="text-3xl">{TYPE_ICON[p.type]}</div>
                  <div className="flex-1">
                    <div className="font-display tracking-wide text-parchment-50">{p.name}</div>
                    <div className="text-xs text-bronze-200">{TYPE_LABEL[p.type]}</div>
                  </div>
                  {owned && (
                    <span className="text-[10px] font-display tracking-wider px-2 py-0.5 rounded bg-bronze-700 text-parchment-50">
                      NÍVEL {p.level + 1}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-parchment-200/70">Preço-base:</span>
                  <span className="font-mono text-right">{formatMoney(p.basePrice)}</span>
                  <span className="text-parchment-200/70">Renda/dia:</span>
                  <span className="font-mono text-right text-bronze-200">
                    {formatMoney(income)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {!owned && !taken && (
                    <Button
                      variant="primary"
                      onClick={() => handleBuy(p)}
                      disabled={bankroll < p.basePrice}
                    >
                      Comprar
                    </Button>
                  )}
                  {owned && upgrade !== null && (
                    <Button
                      variant="secondary"
                      onClick={() => handleUpgrade(p)}
                      disabled={bankroll < upgrade}
                    >
                      Melhorar ({formatMoney(upgrade)})
                    </Button>
                  )}
                  {owned && (
                    <Button variant="ghost" onClick={() => handleSell(p)}>
                      Vender ({formatMoney(sellValue)})
                    </Button>
                  )}
                  {taken && (
                    <span className="text-xs italic text-parchment-200/60 self-center">
                      Sob domínio de um rival
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Modal open={!!actionResult} onClose={() => setActionResult(null)} title="Cartório">
        <p className="text-parchment-50 text-center">{actionResult}</p>
        <div className="flex justify-center mt-4">
          <Button onClick={() => setActionResult(null)}>OK</Button>
        </div>
      </Modal>
    </div>
  );
}
