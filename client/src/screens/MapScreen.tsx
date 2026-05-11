import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/hud/TopBar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CityNode } from '../components/map/CityNode';
import { RoadPath } from '../components/map/RoadPath';
import { MapBackground } from '../components/map/MapBackground';
import { TravelerDot } from '../components/map/TravelerDot';
import { CITIES, ROUTES, findCity, neighborsOf, routeCost } from '../data/cities';
import { canUnlockCity, useMapStore } from '../stores/useMapStore';
import { useEconomyStore } from '../stores/useEconomyStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { audio } from '../services/audio';
import { formatMoney } from '../utils/format';

interface Props {
  onMenu: () => void;
  onEnterCity: () => void;
}

export function MapScreen({ onMenu, onEnterCity }: Props) {
  const currentCityId = useMapStore((s) => s.currentCityId);
  const unlockedCityIds = useMapStore((s) => s.unlockedCityIds);
  const travel = useMapStore((s) => s.travel);
  const travelTo = useMapStore((s) => s.travelTo);
  const reputation = usePlayerStore((s) => s.profile.reputation);
  const bankroll = useEconomyStore((s) => s.bankroll);
  const removeMoney = useEconomyStore((s) => s.removeMoney);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentCity = findCity(currentCityId)!;
  const selected = selectedCityId ? findCity(selectedCityId) : null;
  const neighborIds = neighborsOf(currentCityId);

  const fromCity = travel ? findCity(travel.fromCityId) : null;
  const toCity = travel ? findCity(travel.toCityId) : null;

  function handleNodeClick(cityId: string) {
    if (travel) return;
    if (cityId === currentCityId) {
      onEnterCity();
      return;
    }
    setSelectedCityId(cityId);
    setError(null);
  }

  function handleTravel() {
    if (!selectedCityId) return;
    const city = findCity(selectedCityId);
    if (!city) return;

    if (!unlockedCityIds.includes(selectedCityId)) {
      if (!canUnlockCity(selectedCityId, reputation, bankroll)) {
        setError(
          `Você precisa de pelo menos ${city.unlock.reputation} de reputação${
            city.unlock.bankroll ? ` e ${formatMoney(city.unlock.bankroll)}` : ''
          } para entrar em ${city.name}.`,
        );
        return;
      }
    }

    const cost = routeCost(currentCityId, selectedCityId);
    if (bankroll < cost) {
      setError(`Sem dinheiro para a viagem (custa ${formatMoney(cost)}).`);
      return;
    }
    if (!removeMoney(cost, 'travel', `Viagem para ${city.name}`)) {
      setError('Falha ao debitar custo da viagem.');
      return;
    }

    const result = travelTo(selectedCityId);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    audio.play('cardDeal');
    setSelectedCityId(null);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onMenu={onMenu} />
      <div className="flex-1 px-2 pb-2 flex flex-col">
        <div className="frame-bronze flex-1 relative overflow-hidden">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            role="img"
            aria-label="Mapa da fronteira"
          >
            <MapBackground />
            {/* roads */}
            {ROUTES.map((r) => {
              const a = findCity(r.a)!;
              const b = findCity(r.b)!;
              const highlighted =
                travel
                  ? (r.a === travel.fromCityId && r.b === travel.toCityId) ||
                    (r.b === travel.fromCityId && r.a === travel.toCityId)
                  : (selectedCityId &&
                      ((r.a === currentCityId && r.b === selectedCityId) ||
                        (r.b === currentCityId && r.a === selectedCityId))) ||
                    false;
              return <RoadPath key={`${r.a}-${r.b}`} a={a} b={b} highlighted={!!highlighted} />;
            })}
            {/* cities */}
            {CITIES.map((city) => (
              <CityNode
                key={city.id}
                city={city}
                current={city.id === currentCityId}
                unlocked={unlockedCityIds.includes(city.id)}
                reachable={neighborIds.includes(city.id)}
                onClick={() => handleNodeClick(city.id)}
              />
            ))}
            {travel && fromCity && toCity && (
              <TravelerDot from={fromCity} to={toCity} progress={travel.progress} />
            )}
          </svg>

          {/* legend */}
          <div className="absolute bottom-3 left-3 bg-bg-deep/80 px-3 py-2 rounded text-xs text-parchment-200 border border-bronze-300/20">
            <div className="font-display tracking-widest text-bronze-200 mb-1">Cidades</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-parchment-300 inline-block ring-2 ring-parchment-50" />
              <span>Sua localização</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-bronze-300 inline-block" />
              <span>Desbloqueada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-bronze-700 inline-block" />
              <span>Bloqueada</span>
            </div>
          </div>

          {/* in-city button */}
          <motion.div
            className="absolute top-3 right-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Button variant="primary" onClick={onEnterCity}>
              Entrar em {currentCity.name}
            </Button>
          </motion.div>

          {/* travel banner */}
          {travel && fromCity && toCity && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-bg-deep/80 px-4 py-2 rounded text-parchment-50 font-display tracking-wider border border-bronze-300/20">
              Viajando de {fromCity.name} para {toCity.name}...
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!selected && !travel}
        onClose={() => setSelectedCityId(null)}
        title={selected?.name}
      >
        {selected && (
          <div className="flex flex-col gap-3 text-parchment-50">
            <p className="italic text-parchment-200">{selected.flavor}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-bronze-200">Reputação mínima:</span>
              <span className="font-mono">{selected.unlock.reputation}</span>
              {selected.unlock.bankroll && (
                <>
                  <span className="text-bronze-200">Bankroll mínimo:</span>
                  <span className="font-mono">{formatMoney(selected.unlock.bankroll)}</span>
                </>
              )}
              {neighborIds.includes(selected.id) && (
                <>
                  <span className="text-bronze-200">Custo da viagem:</span>
                  <span className="font-mono">{formatMoney(routeCost(currentCityId, selected.id))}</span>
                </>
              )}
            </div>
            <div className="text-xs text-parchment-200/70">
              <strong>Mesas disponíveis:</strong>
              <ul className="list-disc list-inside mt-1">
                {selected.blindLevels.map((bl, i) => (
                  <li key={i}>
                    {bl.label} ({formatMoney(bl.sb)}/{formatMoney(bl.bb)})
                  </li>
                ))}
              </ul>
            </div>
            {error && (
              <div className="text-oxblood-300 text-sm bg-oxblood-900/30 px-3 py-2 rounded border border-oxblood-500/30">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setSelectedCityId(null)}>
                Fechar
              </Button>
              {neighborIds.includes(selected.id) ? (
                <Button variant="primary" onClick={handleTravel}>
                  Viajar ({formatMoney(routeCost(currentCityId, selected.id))})
                </Button>
              ) : (
                <span className="text-parchment-200/60 italic text-sm self-center">
                  Sem rota direta
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
