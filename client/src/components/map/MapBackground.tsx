/**
 * Background art for the frontier map — purely decorative SVG layers
 * (mountains, mesas, dunes). Original artwork.
 */
export function MapBackground() {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b1a0d" />
          <stop offset="60%" stopColor="#5a3324" />
          <stop offset="100%" stopColor="#7a5b1b" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5b1b" />
          <stop offset="100%" stopColor="#3b2a08" />
        </linearGradient>
      </defs>
      {/* sky */}
      <rect x="0" y="0" width="1000" height="600" fill="url(#sky)" />
      {/* distant mountains */}
      <path
        d="M0 280 L80 220 L150 250 L220 200 L300 240 L380 210 L460 240 L540 200 L620 230 L700 200 L780 240 L860 210 L940 240 L1000 220 L1000 320 L0 320 Z"
        fill="#2a1808"
        opacity="0.85"
      />
      {/* mid mesas */}
      <path
        d="M0 360 L40 350 L40 320 L120 320 L120 350 L240 350 L240 330 L320 330 L320 360 L420 360 L420 340 L500 340 L500 360 L1000 360 L1000 600 L0 600 Z"
        fill="url(#ground)"
      />
      {/* foreground dunes */}
      <path
        d="M0 480 Q200 440 380 470 T780 480 T1000 470 L1000 600 L0 600 Z"
        fill="#3b2a08"
        opacity="0.7"
      />
      {/* Sun */}
      <circle cx="800" cy="140" r="44" fill="#f8d772" opacity="0.4" />
      <circle cx="800" cy="140" r="28" fill="#f8d772" opacity="0.7" />
      {/* tiny cacti */}
      {[
        [120, 540],
        [340, 555],
        [610, 545],
        [750, 540],
        [880, 555],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} fill="#1f6b4a" opacity="0.7">
          <rect x="-1.5" y="-12" width="3" height="14" rx="1" />
          <rect x="-5" y="-8" width="3" height="6" rx="1" />
          <rect x="2" y="-6" width="3" height="8" rx="1" />
        </g>
      ))}
    </g>
  );
}
