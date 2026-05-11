import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/hud/TopBar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { findCity } from '../data/cities';
import { opponentsForCity, OPPONENTS } from '../data/opponents';
import { propertiesForCity } from '../data/properties';
import { useMapStore } from '../stores/useMapStore';
import { useEconomyStore } from '../stores/useEconomyStore';
import { formatMoney } from '../utils/format';
import { audio } from '../services/audio';

interface Props {
  onMenu: () => void;
  onMap: () => void;
  onPoker: (blindLevel: number, opponentIds: string[]) => void;
  onProperty: () => void;
  onBank: () => void;
}

export function CityScreen({ onMenu, onMap, onPoker, onProperty, onBank }: Props) {
  const currentCityId = useMapStore((s) => s.currentCityId);
  const collectDailyIncome = useEconomyStore((s) => s.collectDailyIncome);
  const inGameDay = useEconomyStore((s) => s.inGameDay);

  const city = findCity(currentCityId)!;
  const opps = opponentsForCity(currentCityId);
  const props = propertiesForCity(currentCityId);

  const [tableModal, setTableModal] = useState(false);
  const [opponentCount, setOpponentCount] = useState<number>(3);
  const [restMessage, setRestMessage] = useState<string | null>(null);

  function handleRest() {
    const { propertyIncome, bankInterest } = collectDailyIncome();
    audio.play('cash');
    const parts: string[] = ['Você descansou.'];
    if (propertyIncome > 0) {
      parts.push(`Propriedades renderam ${formatMoney(propertyIncome)}.`);
    }
    if (bankInterest > 0) {
      parts.push(`Juros SELIC pagaram ${formatMoney(bankInterest)} sobre o banco.`);
    }
    if (propertyIncome === 0 && bankInterest === 0) {
      parts.push('(Sem propriedades nem dinheiro no banco para gerar renda.)');
    }
    setRestMessage(parts.join(' '));
  }

  function pickTable(blindLevel: number, opponentCount: number) {
    // Shuffle the city's NPC pool. If the player wants more opponents than the
    // pool has, we pull additional regulars from neighboring cities (deduped),
    // and as a last resort we re-pick from the local pool — the game still works
    // when only 1-2 NPCs live in town.
    const local = [...opps].sort(() => Math.random() - 0.5);
    let pool = [...local];
    if (pool.length < opponentCount) {
      // Bring in travellers from other cities so big tables always fill.
      const travellers = OPPONENTS.filter(
        (o) => !o.cities.includes(currentCityId),
      ).sort(() => Math.random() - 0.5);
      pool = [...pool, ...travellers];
    }
    const chosen = pool.slice(0, opponentCount);
    if (chosen.length < 1) {
      setRestMessage('Não há jogadores nesta cidade. Estranho...');
      return;
    }
    onPoker(blindLevel, chosen.map((o) => o.id));
    setTableModal(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onMenu={onMenu} />
      <div className="flex-1 px-4 py-2 flex flex-col gap-4">
        <motion.div
          className="frame-bronze p-6"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h1
                className="font-display tracking-widest text-4xl text-parchment-50"
                style={{ fontFamily: "'Smokum', serif" }}
              >
                {city.name}
              </h1>
              <p className="text-parchment-200 italic mt-1">{city.flavor}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onMap}>
                ← Mapa
              </Button>
              <Button variant="secondary" onClick={handleRest}>
                Dormir (Dia {inGameDay} → {inGameDay + 1})
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardAction
            title="Saloon"
            subtitle="Mesas de pôquer cash"
            description={`${opps.length} jogadores na cidade · ${city.blindLevels.length} níveis de mesa`}
            icon="♠"
            onClick={() => setTableModal(true)}
            primary
          />
          <CardAction
            title="Cartório"
            subtitle="Compra e venda de propriedades"
            description={`${props.length} imóveis disponíveis nesta cidade`}
            icon="🏠"
            onClick={onProperty}
          />
          <CardAction
            title="Banco"
            subtitle="Depósitos e saques"
            description="Mantenha seu ouro a salvo dos cassinos"
            icon="🏦"
            onClick={onBank}
          />
        </div>

        <div className="frame-bronze p-4">
          <h2 className="font-display tracking-wider text-lg text-bronze-200 divider-stars">
            Conhecidos da cidade
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {opps.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-2 p-2 bg-bg-deep/50 rounded border border-bronze-300/10"
              >
                <div className="w-2 h-2 rounded-full bg-oxblood-400" />
                <div>
                  <div className="font-display tracking-wide text-parchment-50 text-sm">
                    {o.name}
                  </div>
                  <div className="text-xs italic text-parchment-200/70">{o.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={tableModal} onClose={() => setTableModal(false)} title="Escolher mesa">
        <div className="flex flex-col gap-3">
          <div className="bg-bg-deep/50 border border-bronze-300/20 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display tracking-wider text-bronze-200 text-sm">
                Tamanho da mesa
              </span>
              <span className="font-display text-xl text-parchment-50">
                {opponentCount + 1} jogadores
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={7}
              value={opponentCount}
              onChange={(e) => setOpponentCount(Number(e.target.value))}
              className="w-full accent-bronze-400"
              aria-label="Número de adversários"
            />
            <div className="flex justify-between text-[10px] text-parchment-200/60 mt-1">
              <span>Heads-up (você + 2)</span>
              <span>Mesa cheia (você + 7)</span>
            </div>
            <p className="text-xs text-parchment-200/70 mt-2">
              Você jogará contra <strong>{opponentCount} adversário{opponentCount > 1 ? 's' : ''}</strong>.
              {opps.length < opponentCount && (
                <>
                  {' '}
                  <span className="text-bronze-200 italic">
                    Como só há {opps.length} jogador{opps.length === 1 ? '' : 'es'} em{' '}
                    {city.name}, o resto será preenchido por forasteiros de outras cidades.
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="text-xs font-display tracking-widest text-bronze-200 mt-1">
            ESCOLHA O NÍVEL DOS BLINDS
          </div>
          {city.blindLevels.map((bl, i) => (
            <button
              key={i}
              onClick={() => pickTable(i, opponentCount)}
              className="text-left p-3 rounded border border-bronze-300/30 hover:bg-bronze-800/40 hover:border-bronze-300/60 transition-colors"
            >
              <div className="font-display tracking-wider text-parchment-50">{bl.label}</div>
              <div className="text-sm text-parchment-200">
                Blinds: {formatMoney(bl.sb)} / {formatMoney(bl.bb)}
              </div>
              <div className="text-xs text-parchment-200/70 mt-1">
                Buy-in mínimo recomendado: {formatMoney(bl.bb * 50)}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!restMessage} onClose={() => setRestMessage(null)} title="Descanso">
        <p className="text-parchment-50 text-center">{restMessage}</p>
        <div className="flex justify-center mt-4">
          <Button onClick={() => setRestMessage(null)}>Continuar</Button>
        </div>
      </Modal>
    </div>
  );
}

function CardAction({
  title,
  subtitle,
  description,
  icon,
  onClick,
  primary,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <motion.button
      onClick={() => {
        audio.play('click');
        onClick();
      }}
      className={`text-left frame-bronze p-5 hover:scale-[1.015] transition-transform ${
        primary ? 'ring-1 ring-oxblood-400/60' : ''
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl text-bronze-200">{icon}</div>
        <div>
          <div className="font-display text-xl text-parchment-50 tracking-wider">{title}</div>
          <div className="text-bronze-200 text-sm">{subtitle}</div>
          <div className="text-xs text-parchment-200/70 mt-2">{description}</div>
        </div>
      </div>
    </motion.button>
  );
}
