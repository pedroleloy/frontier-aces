import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useEconomyStore } from '../stores/useEconomyStore';
import { useMapStore } from '../stores/useMapStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { audio } from '../services/audio';

interface Props {
  onStart: () => void;
}

export function MainMenuScreen({ onStart }: Props) {
  const profile = usePlayerStore((s) => s.profile);
  const setName = usePlayerStore((s) => s.setName);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const resetEconomy = useEconomyStore((s) => s.reset);
  const resetMap = useMapStore((s) => s.reset);

  const hasSave = profile.stats.handsPlayed > 0 || useEconomyStore.getState().bankroll !== 200;
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [showSettings, setShowSettings] = useState(false);
  const [audioOn, setAudioOn] = useState(audio.enabled);

  function newGame() {
    resetPlayer();
    resetEconomy();
    resetMap();
    if (nameDraft.trim()) setName(nameDraft);
    onStart();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* decorative parchment bg */}
      <div className="absolute inset-0 pointer-events-none opacity-20" aria-hidden="true">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 137) % 1000}
              cy={(i * 211) % 600}
              r={(i % 5) + 1}
              fill="#c79a3e"
            />
          ))}
        </svg>
      </div>

      <motion.div
        className="frame-bronze w-full max-w-lg p-8 text-center relative"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="text-7xl text-bronze-200 mb-1 font-display leading-none">♠</div>
        <h1
          className="font-display text-5xl tracking-widest text-parchment-50 mb-1"
          style={{ fontFamily: "'Smokum', serif" }}
        >
          Frontier Aces
        </h1>
        <p className="font-display text-bronze-200 italic mb-6 divider-stars">
          Aventuras de pôquer no velho oeste
        </p>

        <div className="flex flex-col gap-3">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={20}
            placeholder="Seu nome de jogador"
            className="bg-parchment-50 text-ink border-2 border-bronze-400 rounded px-3 py-2 text-center font-display tracking-wider placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-bronze-300"
          />

          {hasSave && (
            <Button
              variant="primary"
              onClick={() => {
                if (nameDraft.trim() && nameDraft !== profile.name) setName(nameDraft);
                onStart();
              }}
            >
              Continuar Jornada
            </Button>
          )}
          <Button variant={hasSave ? 'secondary' : 'primary'} onClick={newGame}>
            {hasSave ? 'Novo Jogo (apaga progresso)' : 'Começar Jornada'}
          </Button>
          <Button variant="ghost" onClick={() => setShowSettings(true)}>
            Opções
          </Button>
        </div>

        <p className="text-xs text-parchment-200/60 mt-6 italic">
          Single-player · Jogo original · Sem propaganda
        </p>
      </motion.div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Opções">
        <div className="flex flex-col gap-4 text-parchment-50">
          <label className="flex items-center justify-between">
            <span>Som</span>
            <button
              role="switch"
              aria-checked={audioOn}
              onClick={() => {
                const next = !audioOn;
                setAudioOn(next);
                audio.setEnabled(next);
              }}
              className={`px-3 py-1 rounded font-display text-sm ${audioOn ? 'bg-bronze-700' : 'bg-bg-deep'}`}
            >
              {audioOn ? 'LIGADO' : 'DESLIGADO'}
            </button>
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={Math.round(audio.volume * 100)}
              onChange={(e) => audio.setVolume(Number(e.target.value) / 100)}
              className="flex-1 accent-bronze-400"
            />
          </label>
          <p className="text-xs text-parchment-200/60 italic mt-2">
            Os sons são gerados em tempo real via Web Audio — sem assets de áudio externos.
          </p>
        </div>
      </Modal>
    </div>
  );
}
