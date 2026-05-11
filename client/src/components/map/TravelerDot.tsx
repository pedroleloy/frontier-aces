import type { City } from '../../types';

interface Props {
  from: City;
  to: City;
  progress: number; // 0..1
}

/** Animated horseback rider blip moving along travel path. */
export function TravelerDot({ from, to, progress }: Props) {
  // Same curve formula as RoadPath, sample point at t
  const mx = (from.position.x + to.position.x) / 2;
  const my = (from.position.y + to.position.y) / 2;
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * 30;
  const cy = my + ny * 30;
  // quadratic bezier point at t
  const t = Math.max(0, Math.min(1, progress));
  const u = 1 - t;
  const x = u * u * from.position.x + 2 * u * t * cx + t * t * to.position.x;
  const y = u * u * from.position.y + 2 * u * t * cy + t * t * to.position.y;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="4" fill="#f8d772" stroke="#1a120c" strokeWidth="1" />
      <circle r="9" fill="none" stroke="#f8d772" strokeWidth="0.6" opacity="0.5">
        <animate attributeName="r" values="6;14" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="1.4s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}
