import { useState, useEffect } from 'react';
import type { ActionType, TableState } from '../../types';
import { legalActions, type ActionRequest } from '../../engine/pokerEngine';
import { Button } from '../ui/Button';
import { formatMoney } from '../../utils/format';

interface Props {
  table: TableState;
  heroId: string;
  onAction: (req: ActionRequest) => void;
  disabled?: boolean;
}

/**
 * Renders the available actions for the hero player along with a slider for
 * sizing bets/raises.
 */
export function ActionBar({ table, heroId, onAction, disabled }: Props) {
  const actions = legalActions(table, heroId);
  const isHeroTurn = table.players[table.toAct]?.id === heroId;
  const heroSeat = table.players.find((p) => p.id === heroId);

  // Find raise/bet meta for slider bounds
  const raiseAction = actions.find((a) => a.type === 'raise' || a.type === 'bet');
  const min = raiseAction?.minAmount ?? 0;
  const max = raiseAction?.maxAmount ?? 0;
  const [betAmount, setBetAmount] = useState<number>(min);

  useEffect(() => {
    setBetAmount(min);
  }, [min, max, table.toAct]);

  if (!heroSeat || heroSeat.status !== 'active') {
    return (
      <div className="text-center text-parchment-200/60 italic text-sm py-2">
        {heroSeat?.status === 'folded'
          ? 'Você desistiu desta mão'
          : heroSeat?.status === 'allin'
            ? 'Você está all-in'
            : 'Aguardando...'}
      </div>
    );
  }

  if (!isHeroTurn) {
    return (
      <div className="text-center text-parchment-200/60 italic text-sm py-2">
        Aguardando os adversários...
      </div>
    );
  }

  const has = (t: ActionType) => actions.some((a) => a.type === t);

  return (
    <div className="flex flex-col gap-3 p-3 bg-bg-deep/70 rounded-md border border-bronze-300/20">
      {raiseAction && max > min && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="flex-1 accent-bronze-400"
            disabled={disabled}
            aria-label="Tamanho da aposta"
          />
          <span className="font-display text-xl text-bronze-200 min-w-[80px] text-right">
            {formatMoney(betAmount)}
          </span>
          <div className="flex gap-1">
            {[
              { label: '½', factor: 0.5 },
              { label: '¾', factor: 0.75 },
              { label: 'Pot', factor: 1 },
              { label: 'Max', factor: -1 },
            ].map((preset) => (
              <button
                key={preset.label}
                disabled={disabled}
                onClick={() => {
                  if (preset.factor < 0) {
                    setBetAmount(max);
                  } else {
                    const target = Math.round(table.pot * preset.factor) + table.currentBet;
                    setBetAmount(Math.max(min, Math.min(max, target)));
                  }
                }}
                className="px-2 py-1 text-[10px] font-display border border-bronze-300/30 rounded text-parchment-50 hover:bg-bronze-800/40 disabled:opacity-40"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        {has('fold') && (
          <Button variant="ghost" disabled={disabled} onClick={() => onAction({ type: 'fold' })}>
            Foldar
          </Button>
        )}
        {has('check') && (
          <Button variant="secondary" disabled={disabled} onClick={() => onAction({ type: 'check' })}>
            Mesa
          </Button>
        )}
        {has('call') && (
          <Button variant="secondary" disabled={disabled} onClick={() => onAction({ type: 'call' })}>
            Pagar {formatMoney(table.currentBet - heroSeat.currentBet)}
          </Button>
        )}
        {has('bet') && (
          <Button
            variant="primary"
            disabled={disabled}
            onClick={() => onAction({ type: 'bet', amount: betAmount })}
          >
            Apostar {formatMoney(betAmount)}
          </Button>
        )}
        {has('raise') && (
          <Button
            variant="primary"
            disabled={disabled}
            onClick={() => onAction({ type: 'raise', amount: betAmount })}
          >
            Aumentar p/ {formatMoney(betAmount)}
          </Button>
        )}
        {has('allin') && (
          <Button
            variant="primary"
            disabled={disabled}
            onClick={() => onAction({ type: 'allin' })}
          >
            All-in ({formatMoney(heroSeat.chips)})
          </Button>
        )}
      </div>
    </div>
  );
}
