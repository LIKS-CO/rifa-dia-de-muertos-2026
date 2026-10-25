import { Flame } from "lucide-react";

/**
 * A lit candle for the ofrenda. The flame flickers via CSS.
 */
export function Candle({
  className,
  height = 56,
  glow = true,
}: {
  className?: string;
  height?: number;
  glow?: boolean;
}) {
  const body = height * 0.55;
  return (
    <div
      className={`relative flex flex-col items-center ${className ?? ""}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* flame */}
      <div className={glow ? "glow-ember" : ""}>
        <Flame
          className="candle-flame size-6 text-amber-300"
          fill="currentColor"
          strokeWidth={1}
        />
      </div>
      {/* wick */}
      <div className="h-2 w-0.5 rounded bg-stone-700" />
      {/* wax body */}
      <div
        className="w-4 rounded-t-sm rounded-b-md border border-amber-900/40 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.25)]"
        style={{ height: body }}
      />
    </div>
  );
}