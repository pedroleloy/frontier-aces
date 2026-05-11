import { motion } from 'framer-motion';
import { Chip } from './Chip';
import { formatMoney } from '../../utils/format';

interface Props {
  pot: number;
  street: string;
}

const STREET_LABELS: Record<string, string> = {
  preflop: 'Pré-Flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
  idle: '—',
};

export function PotDisplay({ pot, street }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 px-4 py-2 rounded-md bg-bg-deep/60 ring-1 ring-bronze-300/30"
      key={pot}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className="text-[10px] uppercase tracking-widest text-bronze-200 font-display">
        {STREET_LABELS[street] ?? street}
      </span>
      <div className="flex items-center gap-2">
        <Chip amount={pot} size={18} />
        <span className="font-display text-2xl text-parchment-50">{formatMoney(pot)}</span>
      </div>
    </motion.div>
  );
}
