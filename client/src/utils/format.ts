/** Format a number as money. Compact for big amounts: 12.4k, 1.2M */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${sign}$${Math.round(abs).toLocaleString('pt-BR')}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('pt-BR');
}

export function formatPercent(p: number, digits = 0): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
