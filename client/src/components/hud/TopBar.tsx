import { useEconomyStore } from '../../stores/useEconomyStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Coin } from '../ui/Coin';
import { XpBar } from '../ui/XpBar';
import { formatMoney } from '../../utils/format';

const TIER_LABEL: Record<string, string> = {
  drifter: 'Andarilho',
  gambler: 'Apostador',
  highRoller: 'Alto Rolador',
  legend: 'Lenda',
};

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const profile = usePlayerStore((s) => s.profile);
  const bankroll = useEconomyStore((s) => s.bankroll);
  const bank = useEconomyStore((s) => s.bank);
  const inGameDay = useEconomyStore((s) => s.inGameDay);

  return (
    <header className="frame-bronze flex items-center gap-4 px-4 py-2 mx-2 mt-2 mb-2 rounded-md flex-wrap">
      <button
        onClick={onMenu}
        className="font-display text-2xl text-bronze-200 hover:text-bronze-100 tracking-widest"
        aria-label="Menu principal"
      >
        ♠ Frontier Aces
      </button>
      <div className="flex flex-col text-xs text-parchment-200">
        <span className="font-display tracking-wider truncate">{profile.name}</span>
        <span className="text-bronze-200">{TIER_LABEL[profile.tier]}</span>
      </div>
      <div className="flex flex-col w-44">
        <XpBar level={profile.level} xp={profile.xp} />
      </div>
      <div className="flex items-center gap-1 text-parchment-50 font-mono">
        <Coin />
        <span className="font-display text-lg">{formatMoney(bankroll)}</span>
      </div>
      <div className="flex items-center gap-1 text-parchment-200 text-sm">
        <span className="text-bronze-200 font-display tracking-wide">Banco:</span>
        <span className="font-mono">{formatMoney(bank)}</span>
      </div>
      <div className="flex items-center gap-1 text-parchment-200 text-sm">
        <span className="text-bronze-200 font-display tracking-wide">Reputação:</span>
        <span className="font-mono">{profile.reputation}</span>
      </div>
      <div className="ml-auto flex items-center gap-1 text-parchment-200 text-sm">
        <span className="text-bronze-200 font-display tracking-wide">Dia</span>
        <span className="font-mono">{inGameDay}</span>
      </div>
    </header>
  );
}
