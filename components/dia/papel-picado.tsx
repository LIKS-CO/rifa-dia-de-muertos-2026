const PALETTE = ["#f7b733", "#e85d04", "#b74fc4", "#e0567e", "#ffd166", "#8a3ffc"];

/**
 * A papel picado banner — cut-paper flags strung across the page.
 */
export function PapelPicado({
  className,
  segments = 12,
  height = 44,
}: {
  className?: string;
  segments?: number;
  height?: number;
}) {
  const flags = Array.from({ length: segments }).map((_, i) => ({
    color: PALETTE[i % PALETTE.length],
    x: (i * 100) / segments,
    w: 100 / segments,
    // deterministic pseudo-variation so SSR == client render
    skew: ((i * 37) % 5) - 2,
    cut: 0.2 + ((i * 13) % 10) / 22,
  }));

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {flags.map((f, i) => (
        <g key={i}>
          <path
            d={`M ${f.x + 1} ${height * 0.16} L ${f.x + f.w - 1} ${height * 0.16} L ${f.x + f.w - 1} ${height} L ${f.x + 1} ${height} Z`}
            fill={f.color}
            opacity={0.88}
          />
          {/* cutout pattern */}
          <path
            d={`M ${f.x + f.w * 0.18} ${height * 0.26}
                L ${f.x + f.w * 0.38} ${height * 0.26}
                L ${f.x + f.w * 0.5} ${height * 0.38}
                L ${f.x + f.w * 0.62} ${height * 0.26}
                L ${f.x + f.w * 0.82} ${height * 0.26}
                L ${f.x + f.w * 0.82} ${height * f.cut}
                L ${f.x + f.w * 0.62} ${height * (f.cut + 0.12)}
                L ${f.x + f.w * 0.5} ${height * f.cut}
                L ${f.x + f.w * 0.38} ${height * (f.cut + 0.12)}
                L ${f.x + f.w * 0.18} ${height * f.cut} Z`}
            fill="transparent"
            stroke="#16100f"
            strokeWidth={0.7}
            opacity={0.85}
            transform={`skewX(${f.skew})`}
          />
        </g>
      ))}
    </svg>
  );
}