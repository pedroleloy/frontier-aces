import { motion } from 'framer-motion';
import type { City } from '../../types';

interface Props {
  city: City;
  current: boolean;
  unlocked: boolean;
  reachable: boolean;
  onClick?: () => void;
}

const SIZE_RADIUS: Record<City['size'], number> = {
  1: 9,
  2: 11,
  3: 14,
  4: 17,
  5: 21,
};

export function CityNode({ city, current, unlocked, reachable, onClick }: Props) {
  const r = SIZE_RADIUS[city.size];
  const fill = current
    ? '#f8d772'
    : unlocked
      ? '#c79a3e'
      : reachable
        ? '#8e5f1f'
        : '#3b2a08';
  const strokeWidth = current ? 3 : 1.5;

  return (
    <g
      transform={`translate(${city.position.x} ${city.position.y})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {current && (
        <motion.circle
          r={r + 6}
          fill="none"
          stroke="#f8d772"
          strokeWidth={1}
          opacity={0.6}
          animate={{ r: [r + 4, r + 12], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <circle r={r} fill={fill} stroke="#1a120c" strokeWidth={strokeWidth} />
      {/* House icon for unlocked, lock for locked */}
      {unlocked ? (
        <g fill="#1a120c" transform="translate(-4 -3)">
          <path d="M0 6 L4 0 L8 6 L8 8 L0 8 Z" />
        </g>
      ) : (
        <g fill="#7a5b1b" transform="translate(-3 -4)">
          <rect x="1" y="3" width="4" height="5" rx="0.6" />
          <path d="M1.5 3 L1.5 1.5 A1.5 1.5 0 0 1 4.5 1.5 L4.5 3" stroke="#7a5b1b" strokeWidth="0.7" fill="none" />
        </g>
      )}
      <text
        y={r + 16}
        textAnchor="middle"
        fontFamily="'Limelight', serif"
        fontSize="13"
        fill="#fdf9ef"
        stroke="#1a120c"
        strokeWidth="0.4"
        paintOrder="stroke"
      >
        {city.name}
      </text>
    </g>
  );
}
