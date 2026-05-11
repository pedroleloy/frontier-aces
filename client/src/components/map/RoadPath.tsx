import type { City } from '../../types';

interface Props {
  a: City;
  b: City;
  highlighted?: boolean;
}

export function RoadPath({ a, b, highlighted }: Props) {
  // Slight curve so roads don't look like simple straight lines
  const mx = (a.position.x + b.position.x) / 2;
  const my = (a.position.y + b.position.y) / 2;
  // Perpendicular offset for curve control
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const curveStrength = 30;
  const cx = mx + nx * curveStrength;
  const cy = my + ny * curveStrength;
  const d = `M ${a.position.x} ${a.position.y} Q ${cx} ${cy} ${b.position.x} ${b.position.y}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={highlighted ? '#f8d772' : '#7a5b1b'}
      strokeWidth={highlighted ? 2.5 : 1.6}
      strokeDasharray="3 4"
      opacity={highlighted ? 0.95 : 0.7}
    />
  );
}
