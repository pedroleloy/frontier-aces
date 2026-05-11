import { motion } from 'framer-motion';
import { xpRequired } from '../../stores/usePlayerStore';

interface Props {
  level: number;
  xp: number;
}

export function XpBar({ level, xp }: Props) {
  const required = xpRequired(level);
  const pct = Math.min(100, (xp / required) * 100);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs text-parchment-200/70 font-display tracking-wider">
        <span>Lv {level}</span>
        <span>
          {xp}/{required} XP
        </span>
      </div>
      <div className="h-2 rounded-sm overflow-hidden bg-bronze-900/60 ring-1 ring-bronze-300/20">
        <motion.div
          className="h-full bg-gradient-to-r from-bronze-400 to-bronze-200"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
