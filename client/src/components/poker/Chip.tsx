interface Props {
  amount: number;
  size?: number;
}

/** Picks a chip color tier based on amount (cosmetic only). */
function chipColor(amount: number): { fill: string; stroke: string } {
  if (amount >= 1000) return { fill: '#1a1a1a', stroke: '#c79a3e' };
  if (amount >= 100) return { fill: '#7a1f1a', stroke: '#f8d772' };
  if (amount >= 25) return { fill: '#1f3b6b', stroke: '#fdf9ef' };
  if (amount >= 5) return { fill: '#1f6b4a', stroke: '#fdf9ef' };
  return { fill: '#fdf9ef', stroke: '#7a5b1b' };
}

export function Chip({ amount, size = 18 }: Props) {
  const { fill, stroke } = chipColor(amount);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2 2" />
      {/* notches */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="11"
          y="1"
          width="2"
          height="3"
          fill={stroke}
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}
