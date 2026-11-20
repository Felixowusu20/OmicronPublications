import type { CSSProperties } from "react";

type Props = {
  abbr: string;
  /** Primary brand color (border + type). */
  color: string;
  /** Soft fill behind the square. */
  soft?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
};

const SIZES = {
  sm: { box: "h-10 w-10", text: "text-[0.78rem]", overlap: "-0.14em" },
  md: { box: "h-[3.35rem] w-[3.35rem] sm:h-[3.75rem] sm:w-[3.75rem]", text: "text-[0.95rem] sm:text-[1.05rem]", overlap: "-0.16em" },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", text: "text-[1.35rem] sm:text-[1.55rem]", overlap: "-0.18em" },
  xl: { box: "h-28 w-28 sm:h-32 sm:w-32", text: "text-[1.85rem] sm:text-[2.15rem]", overlap: "-0.2em" },
} as const;

/**
 * SAUCIS-style journal mark: serif abbr in a square with the first letter
 * overlapping the left border (like the OJHBR brand asset).
 */
export function JournalAbbrMark({
  abbr,
  color,
  soft = "#f3f6f7",
  size = "md",
  className = "",
  label,
}: Props) {
  const raw = (abbr || "OJ").trim().toUpperCase().slice(0, 6) || "OJ";
  const first = raw.slice(0, 1);
  const rest = raw.slice(1);
  const s = SIZES[size];

  return (
    <div
      className={`omicron-abbr-mark relative flex shrink-0 items-center justify-center rounded-[3px] border-2 ${s.box} ${className}`}
      style={
        {
          borderColor: color,
          color,
          background: soft,
        } as CSSProperties
      }
      aria-label={label || raw}
    >
      <span
        className={`relative font-bold leading-none tracking-[0.04em] ${s.text}`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <span
          className="relative z-[1] inline-block bg-[inherit]"
          style={{
            marginLeft: s.overlap,
            paddingRight: "0.02em",
            background: soft,
          }}
        >
          {first}
        </span>
        <span>{rest}</span>
      </span>
    </div>
  );
}
