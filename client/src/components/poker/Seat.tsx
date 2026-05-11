import { motion } from 'framer-motion';
import type { PlayerSeat as PlayerSeatType } from '../../types';
import { PlayingCard } from './Card';
import { Chip } from './Chip';
import { formatMoney } from '../../utils/format';

interface Props {
  seat: PlayerSeatType;
  isActing: boolean;
  isDealer: boolean;
  showCards: boolean;
}

/**
 * Avatar — original procedural SVG silhouette with hat colour seeded from
 * `avatarSeed`. Zero copyright.
 */
function Avatar({ seed, status }: { seed: string; status: PlayerSeatType['status'] }) {
  // deterministic numeric seed
  const code = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hatHues = ['#7a1f1a', '#3b0f0d', '#1a120c', '#7a5b1b', '#1f3b6b'];
  const skinHues = ['#d6a679', '#a87447', '#6e4a2c', '#e2b88a'];
  const hat = hatHues[code % hatHues.length];
  const skin = skinHues[(code >> 1) % skinHues.length];
  const dim = status === 'folded' || status === 'busted';
  return (
    <svg
      viewBox="0 0 60 60"
      width="48"
      height="48"
      style={{ opacity: dim ? 0.35 : 1 }}
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="28" fill="#0d0805" stroke="#c79a3e" strokeWidth="1.2" />
      {/* face */}
      <ellipse cx="30" cy="34" rx="12" ry="14" fill={skin} />
      {/* mustache (deterministic) */}
      {code % 3 === 0 && (
        <path d="M22 38 Q30 42 38 38" stroke="#3b1a0d" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* hat */}
      <path d="M14 24 Q30 8 46 24 L46 28 L14 28 Z" fill={hat} stroke="#1a120c" strokeWidth="0.6" />
      <ellipse cx="30" cy="28" rx="20" ry="2.5" fill={hat} stroke="#1a120c" strokeWidth="0.6" />
      {/* hat band */}
      <rect x="14" y="26" width="32" height="2" fill="#c79a3e" opacity="0.7" />
    </svg>
  );
}

export function Seat({ seat, isActing, isDealer, showCards }: Props) {
  const isFolded = seat.status === 'folded';
  return (
    <motion.div
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md
        ${isActing ? 'ring-2 ring-bronze-300 shadow-lg shadow-bronze-300/30' : ''}
        ${isFolded ? 'opacity-50' : ''}
        bg-bg-deep/70 backdrop-blur-sm border border-bronze-300/10
        min-w-[110px]`}
      animate={isActing ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={isActing ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
    >
      <div className="flex items-center gap-1 w-full">
        <Avatar seed={seat.avatarSeed} status={seat.status} />
        <div className="flex flex-col items-start text-xs leading-tight">
          <span className="font-display tracking-wider text-parchment-50 truncate max-w-[70px]">
            {seat.name}
          </span>
          <span className="text-bronze-200 font-mono">{formatMoney(seat.chips)}</span>
        </div>
        {isDealer && (
          <span className="ml-auto text-[10px] font-display rounded-full bg-bronze-300 text-ink w-5 h-5 flex items-center justify-center">
            D
          </span>
        )}
      </div>
      {/* hole cards */}
      <div className="flex gap-0.5 h-[52px]">
        {seat.hole ? (
          <>
            <PlayingCard card={seat.hole[0]} faceDown={!showCards && !seat.isHero} size="sm" />
            <PlayingCard card={seat.hole[1]} faceDown={!showCards && !seat.isHero} size="sm" />
          </>
        ) : (
          <div className="text-[10px] text-parchment-200/40">—</div>
        )}
      </div>
      {/* current bet */}
      {seat.currentBet > 0 && (
        <div className="flex items-center gap-1 text-xs font-mono text-parchment-50">
          <Chip amount={seat.currentBet} size={14} />
          {formatMoney(seat.currentBet)}
        </div>
      )}
      {seat.status === 'allin' && (
        <span className="text-[10px] uppercase font-display tracking-wider text-oxblood-300">
          all-in
        </span>
      )}
    </motion.div>
  );
}
