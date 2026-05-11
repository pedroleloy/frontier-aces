import { motion } from 'framer-motion';
import type { Card as CardType, Suit } from '../../types';
import { rankToString, suitSymbol } from '../../engine/deck';

interface Props {
  card?: CardType | null;
  /** When true, shows the back design instead of the face. */
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

const SIZES = {
  sm: { w: 36, h: 52, font: 12 },
  md: { w: 56, h: 78, font: 18 },
  lg: { w: 80, h: 112, font: 28 },
};

const SUIT_COLOR: Record<Suit, string> = {
  hearts: '#a8352c',
  diamonds: '#a8352c',
  clubs: '#1a120c',
  spades: '#1a120c',
};

export function PlayingCard({ card, faceDown = false, size = 'md', highlight = false }: Props) {
  const { w, h, font } = SIZES[size];
  return (
    <motion.div
      className={`card-shadow rounded-md inline-block select-none ${
        highlight ? 'ring-2 ring-bronze-300 shadow-[0_0_18px_rgba(199,154,62,0.55)]' : ''
      }`}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ width: w, height: h, perspective: 600 }}
    >
      {faceDown || !card ? <CardBack w={w} h={h} /> : <CardFace card={card} w={w} h={h} font={font} />}
    </motion.div>
  );
}

function CardFace({ card, w, h, font }: { card: CardType; w: number; h: number; font: number }) {
  const color = SUIT_COLOR[card.suit];
  const r = rankToString(card.rank);
  const s = suitSymbol(card.suit);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id="paper-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf9ef" />
          <stop offset="100%" stopColor="#e8dec4" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="5" fill="url(#paper-grad)" stroke="#7a5b1b" strokeWidth="0.8" />
      {/* corners */}
      <text x="5" y={font + 3} fontFamily="serif" fontWeight="700" fontSize={font} fill={color}>
        {r}
      </text>
      <text x="5" y={font * 2 + 2} fontFamily="serif" fontSize={font * 0.8} fill={color}>
        {s}
      </text>
      {/* center pip */}
      <text
        x={w / 2}
        y={h / 2 + font * 0.9}
        fontFamily="serif"
        fontSize={font * 2.4}
        fill={color}
        textAnchor="middle"
      >
        {s}
      </text>
      {/* mirrored corner */}
      <g transform={`rotate(180 ${w / 2} ${h / 2})`}>
        <text x="5" y={font + 3} fontFamily="serif" fontWeight="700" fontSize={font} fill={color}>
          {r}
        </text>
        <text x="5" y={font * 2 + 2} fontFamily="serif" fontSize={font * 0.8} fill={color}>
          {s}
        </text>
      </g>
    </svg>
  );
}

function CardBack({ w, h }: { w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id="back-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7a1f1a" />
          <stop offset="100%" stopColor="#3b0f0d" />
        </linearGradient>
        <pattern id="back-pat" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="url(#back-grad)" />
          <path d="M0 6 L6 0" stroke="#c79a3e" strokeWidth="0.4" opacity="0.6" />
          <path d="M0 0 L6 6" stroke="#c79a3e" strokeWidth="0.4" opacity="0.6" />
        </pattern>
      </defs>
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="5" fill="url(#back-pat)" stroke="#c79a3e" strokeWidth="1" />
      {/* central diamond ornament */}
      <g transform={`translate(${w / 2} ${h / 2})`}>
        <path
          d="M 0 -10 L 8 0 L 0 10 L -8 0 Z"
          fill="none"
          stroke="#c79a3e"
          strokeWidth="1.2"
        />
        <circle r="2" fill="#c79a3e" />
      </g>
    </svg>
  );
}
