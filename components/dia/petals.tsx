/**
 * Drifting cempasúchil petals. Deterministic pseudo-random placement so the
 * server and client renders match (no hydration mismatch).
 */
export function FallingPetals({
  count = 18,
  className,
}: {
  count?: number;
  className?: string;
}) {
  // Small deterministic PRNG
  const rand = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = rand(i) * 100;
        const delay = rand(i + 100) * 12;
        const dur = 9 + rand(i + 200) * 12;
        const size = 12 + rand(i + 300) * 14;
        const hue = 36 + rand(i + 400) * 12;
        return (
          <span
            key={i}
            className="petal"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.62,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              background: `hsl(${hue} 90% 45% / 0.75)`,
              borderRadius: "62% 38% 58% 42% / 58% 48% 62% 46%",
            }}
          />
        );
      })}
    </div>
  );
}