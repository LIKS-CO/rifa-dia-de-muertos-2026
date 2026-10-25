import { useId } from "react";

/**
 * A cempasúchil (marigold) flower — the classic Día de Muertos bloom.
 * Rendered as an SVG rosette. `useId` keeps the gradient unique per instance.
 */
export function Marigold({
  className,
  petals = 14,
  size = 64,
}: {
  className?: string;
  petals?: number;
  size?: number;
}) {
  const id = useId();
  const gradId = `marigold-${id}`;
  const petal = (
    <ellipse cx="0" cy={-size * 0.36} rx={size * 0.13} ry={size * 0.33} fill={`url(#${gradId})`} />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="45%" stopColor="#f7b733" />
          <stop offset="100%" stopColor="#e85d04" />
        </radialGradient>
      </defs>
      {Array.from({ length: petals }).map((_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / petals})`}>
          {petal}
        </g>
      ))}
      <circle r={size * 0.16} fill="#d9480f" />
      <circle r={size * 0.07} fill="#ffd166" />
    </svg>
  );
}