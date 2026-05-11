import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/hud/TopBar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PokerTable } from '../components/poker/Table';
import { ActionBar } from '../components/poker/ActionBar';
import { PlayingCard } from '../components/poker/Card';
import { findCity } from '../data/cities';
import { OPPONENTS } from '../data/opponents';
import { usePokerStore } from '../stores/usePokerStore';
import { useEconomyStore } from '../stores/useEconomyStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { audio } from '../services/audio';
import { formatMoney } from '../utils/format';
import { CATEGORY_LABEL_PT } from '../engine/handEvaluator';

interface Props {
  cityId: string;
  blindLevel: number;
  opponentIds: string[];
  onLeave: () => void;
}

export function PokerScreen({ cityId, blindLevel, opponentIds, onLeave }: Props) {
  const city = findCity(cityId)!;
  const blinds = city.blindLevels[blindLevel];

  const profile = usePlayerStore((s) => s.profile);
  const setName = usePlayerStore((s) => s.setName);
  const addXp = usePlayerStore((s) => s.addXp);
  const addReputation = usePlayerStore((s) => s.addReputation);
  const recordHand = usePlayerStore((s) => s.recordHand);

  const bankroll = useEconomyStore((s) => s.bankroll);
  const removeMoney = useEconomyStore((s) => s.removeMoney);
  const addMoney = useEconomyStore((s) => s.addMoney);

  const table = usePokerStore((s) => s.table);
  const lastShowdown = usePokerStore((s) => s.lastShowdown);
  const newTable = usePokerStore((s) => s.newTable);
  const startNextHand = usePokerStore((s) => s.startNextHand);
  const heroAction = usePokerStore((s) => s.heroAction);
  const tick = usePokerStore((s) => s.tick);
  const closeShowdown = usePokerStore((s) => s.closeShowdown);
  const endTable = usePokerStore((s) => s.endTable);

  const [buyInModal, setBuyInModal] = useState<{ open: boolean; amount: number }>({
    open: true,
    amount: blinds.bb * 50,
  });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [potBeforeShowdown, setPotBeforeShowdown] = useState(0);

  // Track pot before showdown awards so we can show "you won X"
  const potRef = useRef(0);
  useEffect(() => {
    if (table && table.street !== 'showdown') {
      potRef.current = table.pot;
    }
  }, [table]);

  // AI tick loop — drives non-hero actions
  useEffect(() => {
    if (!table) return;
    if (table.street === 'idle' || table.street === 'showdown') return;
    const actor = table.players[table.toAct];
    if (!actor || actor.isHero) return;
    const id = setTimeout(() => {
      tick();
    }, 600 + Math.random() * 600);
    return () => clearTimeout(id);
  }, [table, tick]);

  // When showdown happens, snapshot pot value
  useEffect(() => {
    if (lastShowdown) {
      setPotBeforeShowdown(potRef.current);
    }
  }, [lastShowdown]);

  function startSession(buyIn: number) {
    if (!removeMoney(buyIn, 'poker', `Buy-in em ${city.name}`)) {
      // graceful: just close modal
      onLeave();
      return;
    }
    if (profile.name && profile.name !== 'Forasteiro') {
      // ok
    } else {
      setName('Forasteiro');
    }
    const opponents = opponentIds
      .map((id) => OPPONENTS.find((o) => o.id === id))
      .filter((o): o is NonNullable<typeof o> => !!o)
      .map((o) => ({
        id: o.id,
        name: o.name,
        chips: blinds.bb * o.buyInMultiplier,
        personality: o.personality,
        avatarSeed: o.avatarSeed,
      }));
    newTable({
      blinds: { sb: blinds.sb, bb: blinds.bb },
      heroChips: buyIn,
      opponents,
      heroName: profile.name,
      heroSeed: profile.avatarSeed,
    });
    setBuyInModal({ open: false, amount: buyIn });
    setTimeout(() => {
      startNextHand();
      audio.play('cardDeal');
    }, 250);
  }

  function handleHeroAction(req: Parameters<typeof heroAction>[0]) {
    audio.play(req.type === 'fold' ? 'fold' : 'chipDrop');
    heroAction(req);
  }

  function handleNextHand() {
    closeShowdown();
    // Award winnings to bankroll BEFORE next hand if hero busted
    setTimeout(() => {
      const t = usePokerStore.getState().table;
      if (!t) return;
      const hero = t.players.find((p) => p.isHero);
      if (!hero) return;
      if (hero.chips <= 0) {
        // busted
        return;
      }
      // If only 1 player has chips, end session
      const withChips = t.players.filter((p) => p.chips > 0);
      if (withChips.length < 2) return;
      startNextHand();
      audio.play('cardDeal');
    }, 100);
  }

  function handleLeave() {
    if (table) {
      const { heroFinalChips } = endTable();
      if (heroFinalChips > 0) {
        addMoney(heroFinalChips, 'poker', `Cash-out em ${city.name}`);
      }
      // Track stats — XP/reputation tied to time at table, sized to BB level
      const xpReward = Math.max(5, Math.round(heroFinalChips / Math.max(1, blinds.bb * 10)));
      addXp(xpReward);
      const repReward = Math.max(0, Math.round((heroFinalChips - buyInModal.amount) / Math.max(1, blinds.bb * 50)));
      if (repReward > 0) addReputation(repReward);
    }
    setShowLeaveConfirm(false);
    onLeave();
  }

  // Showdown info
  const showdownInfo = useMemo(() => {
    if (!lastShowdown) return null;
    const heroWin = lastShowdown.winners.find((w) => w.playerId === 'hero');
    const won = heroWin?.amount ?? 0;
    return {
      heroAmount: won,
      winners: lastShowdown.winners,
      reveals: lastShowdown.reveals,
      potTotal: potBeforeShowdown,
    };
  }, [lastShowdown, potBeforeShowdown]);

  useEffect(() => {
    if (showdownInfo) {
      audio.play(showdownInfo.heroAmount > 0 ? 'win' : 'lose');
      const heroSeat = table?.players.find((p) => p.isHero);
      const won = showdownInfo.heroAmount > 0;
      recordHand(won, showdownInfo.potTotal);
      if (won) addXp(8);
      if (heroSeat && showdownInfo.heroAmount > 0) addReputation(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showdownInfo]);

  // Hero busted detection
  const heroBusted =
    table &&
    table.players.find((p) => p.isHero)?.chips === 0 &&
    table.street === 'idle';

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 px-2 py-2 flex flex-col gap-2">
        <div className="frame-bronze flex items-center justify-between px-4 py-2">
          <div>
            <div className="font-display tracking-wider text-bronze-200 text-sm">
              {city.name} · {blinds.label}
            </div>
            <div className="text-xs text-parchment-200/70">
              Blinds: {formatMoney(blinds.sb)} / {formatMoney(blinds.bb)}
            </div>
          </div>
          <Button variant="ghost" onClick={() => setShowLeaveConfirm(true)}>
            Sair da mesa
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {table ? (
            <>
              <PokerTable table={table} />
              <div className="w-full max-w-3xl mt-2">
                <ActionBar
                  table={table}
                  heroId="hero"
                  onAction={handleHeroAction}
                  disabled={!!lastShowdown}
                />
              </div>
            </>
          ) : (
            <div className="text-parchment-200 italic">Preparando a mesa...</div>
          )}
        </div>
      </div>

      {/* Buy-in modal */}
      <Modal open={buyInModal.open} title="Comprar fichas" closeable={false}>
        <div className="flex flex-col gap-3 text-parchment-50">
          <p className="text-sm text-parchment-200">
            Mesa: <strong>{blinds.label}</strong> ({formatMoney(blinds.sb)} /{' '}
            {formatMoney(blinds.bb)})
          </p>
          <p className="text-sm text-parchment-200">
            Bankroll disponível: <strong>{formatMoney(bankroll)}</strong>
          </p>
          <label className="flex flex-col gap-2">
            <span className="text-sm">
              Buy-in (recomendado: {formatMoney(blinds.bb * 50)} — 50 BBs):
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={blinds.bb * 20}
                max={Math.min(bankroll, blinds.bb * 200)}
                step={blinds.bb}
                value={Math.min(buyInModal.amount, bankroll)}
                onChange={(e) =>
                  setBuyInModal({ open: true, amount: Number(e.target.value) })
                }
                className="flex-1 accent-bronze-400"
              />
              <span className="font-display text-xl text-bronze-200 min-w-[100px] text-right">
                {formatMoney(buyInModal.amount)}
              </span>
            </div>
          </label>
          {bankroll < blinds.bb * 20 && (
            <div className="text-oxblood-300 text-sm bg-oxblood-900/30 px-3 py-2 rounded">
              Bankroll insuficiente para esta mesa (mínimo {formatMoney(blinds.bb * 20)}).
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onLeave}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={bankroll < blinds.bb * 20}
              onClick={() => startSession(Math.min(buyInModal.amount, bankroll))}
            >
              Comprar fichas
            </Button>
          </div>
        </div>
      </Modal>

      {/* Showdown / hand result modal */}
      <Modal
        open={!!showdownInfo}
        onClose={handleNextHand}
        title={showdownInfo && showdownInfo.heroAmount > 0 ? 'Você venceu a mão!' : 'Fim da mão'}
        width="lg"
      >
        {showdownInfo && (() => {
          // Identify the absolute winner — the reveal with highest hand strength.
          // (For multi-pot games, the player who took the most chips overall.)
          const winner =
            [...showdownInfo.reveals].sort(
              (a, b) => b.hand.strength - a.hand.strength,
            )[0] ?? null;
          // Set of "rank-suit" keys for cards that form the winning 5-card hand.
          const winningKeys = new Set<string>(
            winner ? winner.hand.cards.map((c) => `${c.rank}-${c.suit}`) : [],
          );
          const inWin = (c: { rank: number; suit: string }) =>
            winningKeys.has(`${c.rank}-${c.suit}`);
          const winnerSeat = winner
            ? table?.players.find((p) => p.id === winner.playerId)
            : null;
          const winnerName = winnerSeat?.isHero
            ? 'Você'
            : (winnerSeat?.name ?? 'Outro jogador');

          // Build the explanatory line using HandRank.label (already pt-BR).
          const explanation = winner
            ? `${winnerName} venceu com ${winner.hand.label}.`
            : 'Mão encerrada sem revelação (todos desistiram).';

          return (
            <div className="flex flex-col gap-4 text-parchment-50">
              {/* Big win amount or "lost" indicator */}
              {showdownInfo.heroAmount > 0 ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center font-display text-3xl text-bronze-200"
                >
                  + {formatMoney(showdownInfo.heroAmount)}
                </motion.div>
              ) : (
                <p className="text-center text-parchment-200 italic">
                  O pote desta vez foi para outro.
                </p>
              )}

              {/* Winner explanation */}
              {winner && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center px-4 py-3 rounded bg-bronze-900/40 border border-bronze-300/30"
                >
                  <div className="font-display text-lg text-bronze-200 tracking-wider">
                    {explanation}
                  </div>
                  <div className="text-xs text-parchment-200/70 mt-1">
                    Categoria: {CATEGORY_LABEL_PT[winner.hand.category]} · Cartas destacadas em
                    dourado formam a mão vencedora.
                  </div>
                </motion.div>
              )}

              {/* Community + winner's hole cards, side-by-side, with highlights */}
              {winner && table && (
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-[10px] tracking-widest uppercase text-bronze-200">
                    Comunidade
                  </div>
                  <div className="flex gap-1">
                    {table.community.map((c, i) => (
                      <PlayingCard
                        key={i}
                        card={c}
                        size="sm"
                        highlight={inWin(c)}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] tracking-widest uppercase text-bronze-200 mt-2">
                    Cartas de {winnerName}
                  </div>
                  <div className="flex gap-1">
                    <PlayingCard card={winner.hole[0]} size="sm" highlight={inWin(winner.hole[0])} />
                    <PlayingCard card={winner.hole[1]} size="sm" highlight={inWin(winner.hole[1])} />
                  </div>
                </div>
              )}

              {/* All revealed players (for comparison) */}
              {showdownInfo.reveals.length > 1 && (
                <div className="space-y-2">
                  <div className="font-display text-bronze-200 text-sm divider-stars text-center">
                    Mãos reveladas
                  </div>
                  {showdownInfo.reveals.map((r) => {
                    const seat = table?.players.find((p) => p.id === r.playerId);
                    const isWinner = winner?.playerId === r.playerId;
                    return (
                      <div
                        key={r.playerId}
                        className={`flex items-center gap-3 p-2 rounded ${
                          isWinner
                            ? 'bg-bronze-900/40 border border-bronze-300/40'
                            : 'bg-bg-deep/50 border border-bronze-300/10'
                        }`}
                      >
                        <div className="flex gap-1">
                          <PlayingCard
                            card={r.hole[0]}
                            size="sm"
                            highlight={isWinner && inWin(r.hole[0])}
                          />
                          <PlayingCard
                            card={r.hole[1]}
                            size="sm"
                            highlight={isWinner && inWin(r.hole[1])}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-display tracking-wide">
                            {seat?.isHero ? `${seat.name} (você)` : seat?.name}
                            {isWinner && (
                              <span className="ml-2 text-[10px] font-display tracking-widest px-1.5 py-0.5 rounded bg-bronze-300 text-ink">
                                VENCEDOR
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-bronze-200">{r.hand.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-center gap-2 mt-1">
                {heroBusted ? (
                  <Button variant="primary" onClick={() => { closeShowdown(); handleLeave(); }}>
                    Sair da mesa (sem fichas)
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleNextHand}>
                    Próxima mão
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Leave confirmation */}
      <Modal
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Sair da mesa?"
      >
        <div className="text-parchment-50">
          <p>Suas fichas serão convertidas em dinheiro de volta ao bankroll.</p>
          {table && (
            <p className="mt-2 text-bronze-200">
              Cash-out:{' '}
              <span className="font-display text-xl">
                {formatMoney(table.players.find((p) => p.isHero)?.chips ?? 0)}
              </span>
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)}>
              Continuar jogando
            </Button>
            <Button variant="primary" onClick={handleLeave}>
              Confirmar saída
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
