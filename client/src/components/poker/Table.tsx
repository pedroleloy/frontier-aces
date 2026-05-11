import { motion } from 'framer-motion';
import type { TableState } from '../../types';
import { PlayingCard } from './Card';
import { Seat } from './Seat';
import { PotDisplay } from './PotDisplay';

interface Props {
  table: TableState;
}

/**
 * Lays seats out elliptically around a felt-green table.
 * Hero is always anchored at bottom-center.
 */
export function PokerTable({ table }: Props) {
  const heroIdx = table.players.findIndex((p) => p.isHero);
  const players = table.players;
  const n = players.length;
  // Positions: hero at index 0 → angle 90° (bottom), then rotate clockwise
  const positions = players.map((_, i) => {
    const offset = (i - heroIdx + n) % n;
    const angle = (Math.PI / 2) + (offset * (2 * Math.PI)) / n;
    // Ellipse around table — semi-major 42%, semi-minor 36%
    return {
      left: `${50 + Math.cos(angle) * 42}%`,
      top: `${50 + Math.sin(angle) * 38}%`,
    };
  });

  const showResults = table.street === 'showdown';

  return (
    <div className="relative w-full aspect-[16/9] max-w-5xl mx-auto">
      {/* felt */}
      <div
        className="absolute inset-4 rounded-[50%] border-[6px] border-bronze-700 shadow-2xl"
        style={{ background: 'var(--felt-gradient)' }}
      >
        <div className="absolute inset-3 rounded-[50%] border border-bronze-300/20" />
      </div>

      {/* community cards + pot — center of table */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <PotDisplay pot={table.pot} street={table.street} />
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => {
            const card = table.community[i];
            return card ? (
              <motion.div
                key={i}
                initial={{ y: -30, opacity: 0, rotateZ: -10 }}
                animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: 'easeOut' }}
              >
                <PlayingCard card={card} size="md" />
              </motion.div>
            ) : (
              <div
                key={i}
                className="w-[56px] h-[78px] rounded-md border border-bronze-300/20 bg-black/20"
              />
            );
          })}
        </div>
      </div>

      {/* seats positioned around */}
      {players.map((seat, i) => (
        <div
          key={seat.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: positions[i].left, top: positions[i].top }}
        >
          <Seat
            seat={seat}
            isActing={table.toAct === i && table.street !== 'showdown' && seat.status === 'active'}
            isDealer={table.dealerIndex === i}
            showCards={showResults && (seat.status === 'active' || seat.status === 'allin')}
          />
        </div>
      ))}
    </div>
  );
}
