import { useState } from 'react';
import { TopBar } from '../components/hud/TopBar';
import { Button } from '../components/ui/Button';
import {
  SELIC_ANNUAL_RATE,
  SELIC_COMPOUND_WINDOW_DAYS,
  SELIC_DAILY_RATE,
  useEconomyStore,
} from '../stores/useEconomyStore';
import { formatMoney } from '../utils/format';
import { audio } from '../services/audio';

interface Props {
  onBack: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  poker: '🂠 Pôquer',
  property: '🏠 Imóvel',
  travel: '🐎 Viagem',
  shop: '💼 Banco',
  event: '✨ Evento',
  mission: '🎯 Missão',
};

export function BankScreen({ onBack }: Props) {
  const bankroll = useEconomyStore((s) => s.bankroll);
  const bank = useEconomyStore((s) => s.bank);
  const transactions = useEconomyStore((s) => s.transactions);
  const depositToBank = useEconomyStore((s) => s.depositToBank);
  const withdrawFromBank = useEconomyStore((s) => s.withdrawFromBank);

  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  function handleDeposit() {
    setError(null);
    setHint(null);
    if (amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (depositToBank(amount)) {
      audio.play('cash');
      const projection = Math.round(amount * SELIC_DAILY_RATE);
      setHint(
        projection > 0
          ? `Depósito realizado. A cada vez que você "Dormir" na cidade, este saldo renderá juros (~${formatMoney(projection)} no próximo descanso para este depósito).`
          : 'Depósito realizado. Os juros são creditados toda vez que você "Dormir" na cidade.',
      );
      setAmount(0);
    } else {
      setError('Bankroll insuficiente.');
    }
  }
  function handleWithdraw() {
    setError(null);
    setHint(null);
    if (amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (withdrawFromBank(amount)) {
      audio.play('cash');
      setAmount(0);
    } else {
      setError('Saldo do banco insuficiente.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 px-4 py-2 flex flex-col gap-3">
        <div className="frame-bronze p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl tracking-wider text-parchment-50">
              Banco da Fronteira
            </h1>
            <p className="text-sm text-parchment-200">
              Dinheiro no banco fica protegido e não pode ser perdido em mesas de pôquer.
            </p>
          </div>
          <Button variant="ghost" onClick={onBack}>
            ← Voltar à cidade
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="frame-bronze p-4 flex flex-col gap-2">
            <div className="font-display tracking-wider text-bronze-200 text-sm">No bolso</div>
            <div className="font-display text-3xl text-parchment-50">{formatMoney(bankroll)}</div>
            <div className="text-xs text-parchment-200/70">
              Em risco quando você senta em uma mesa.
            </div>
          </div>
          <div className="frame-bronze p-4 flex flex-col gap-2">
            <div className="font-display tracking-wider text-bronze-200 text-sm">No banco</div>
            <div className="font-display text-3xl text-parchment-50">{formatMoney(bank)}</div>
            <div className="text-xs text-parchment-200/70">
              Protegido. Saque a qualquer momento.
            </div>
            <div className="mt-2 border-t border-bronze-300/20 pt-2 space-y-1">
              <div className="text-xs text-bronze-200">
                💰 <strong>Rendimento SELIC:</strong> {(SELIC_ANNUAL_RATE * 100).toFixed(2)}% a.a.
                aplicado em {SELIC_COMPOUND_WINDOW_DAYS} dias de jogo
                ({(SELIC_DAILY_RATE * 100).toFixed(2)}% ao dia, capitalização composta).
              </div>
              {bank > 0 ? (
                <div className="text-xs text-parchment-200/90">
                  Próximo crédito (ao <em className="text-bronze-200">Dormir</em> na cidade):{' '}
                  <span className="font-mono text-bronze-200 text-sm">
                    +{formatMoney(Math.round(bank * SELIC_DAILY_RATE))}
                  </span>
                </div>
              ) : (
                <div className="text-xs italic text-parchment-200/60">
                  Deposite algo e durma na cidade para ver o rendimento.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="frame-bronze p-4 flex flex-col gap-3">
          <h2 className="font-display tracking-wider text-bronze-200 divider-stars text-center">
            Operação
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min={0}
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              placeholder="Valor"
              className="bg-parchment-50 text-ink border-2 border-bronze-400 rounded px-3 py-2 font-mono placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-bronze-300 flex-1 min-w-[120px]"
            />
            <Button variant="primary" onClick={handleDeposit} disabled={amount <= 0}>
              Depositar
            </Button>
            <Button variant="secondary" onClick={handleWithdraw} disabled={amount <= 0}>
              Sacar
            </Button>
          </div>
          {error && (
            <div className="text-oxblood-300 text-sm bg-oxblood-900/30 px-3 py-2 rounded border border-oxblood-500/30">
              {error}
            </div>
          )}
          {hint && (
            <div className="text-bronze-200 text-sm bg-bronze-900/30 px-3 py-2 rounded border border-bronze-300/30">
              {hint}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="text-xs px-3 py-1 border border-bronze-300/30 rounded font-display tracking-wider text-parchment-50 hover:bg-bronze-800/40"
              >
                {formatMoney(preset)}
              </button>
            ))}
            <button
              onClick={() => setAmount(bankroll)}
              className="text-xs px-3 py-1 border border-bronze-300/30 rounded font-display tracking-wider text-parchment-50 hover:bg-bronze-800/40"
            >
              Tudo no bolso
            </button>
          </div>
        </div>

        <div className="frame-bronze p-4">
          <h2 className="font-display tracking-wider text-bronze-200 divider-stars text-center">
            Últimos lançamentos
          </h2>
          <ul className="mt-2 divide-y divide-bronze-300/10 max-h-72 overflow-y-auto">
            {transactions.length === 0 && (
              <li className="text-sm italic text-parchment-200/60 py-2 text-center">
                Sem transações ainda.
              </li>
            )}
            {transactions.slice(0, 30).map((tx) => (
              <li key={tx.id} className="py-1.5 flex items-center justify-between text-sm">
                <div>
                  <div className="text-parchment-50">{tx.note}</div>
                  <div className="text-xs text-parchment-200/60">
                    {CATEGORY_LABEL[tx.category] ?? tx.category}
                  </div>
                </div>
                <span
                  className={`font-mono ${
                    tx.amount > 0
                      ? 'text-bronze-200'
                      : tx.amount < 0
                        ? 'text-oxblood-300'
                        : 'text-parchment-200/50'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {formatMoney(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
