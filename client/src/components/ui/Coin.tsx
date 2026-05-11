interface CoinProps {
  size?: number;
}
export function Coin({ size = 16 }: CoinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="inline-block flex-shrink-0"
    >
      <defs>
        <radialGradient id="coin-grad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#f8d772" />
          <stop offset="50%" stopColor="#c79a3e" />
          <stop offset="100%" stopColor="#7a5b1b" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#coin-grad)" stroke="#5a3f0e" strokeWidth="0.8" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="serif"
        fontWeight="700"
        fontSize="11"
        fill="#3b2a08"
      >
        $
      </text>
    </svg>
  );
}
