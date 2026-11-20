type Variant = "screen" | "panel" | "inline" | "dark";

type Props = {
  /** Short status line, e.g. "Loading your manuscript…" */
  label?: string;
  variant?: Variant;
  className?: string;
};

/**
 * Folio loader — three composing rules + imprint wordmark.
 * Quieter than a spinner; reads like a page being set.
 */
export function OmicronLoader({ label, variant = "panel", className }: Props) {
  const onDark = variant === "dark";
  const isRow = variant === "inline";
  const isFull = variant === "screen" || variant === "dark";

  const wrapper = isFull
    ? "flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-6 py-16"
    : variant === "panel"
      ? "flex w-full flex-col items-center justify-center gap-5 px-6 py-12"
      : "flex w-full items-center justify-center gap-4 px-4 py-6";

  const ruleTrack = onDark ? "bg-white/15" : "bg-[var(--line)]";
  const ruleFill = onDark ? "bg-[#f3c4b0]" : "bg-[var(--accent)]";

  const folio = (
    <div
      className={`omicron-folio flex flex-col gap-1.5 ${isRow ? "w-16" : "w-28 sm:w-36"}`}
      aria-hidden
    >
      <span className={`relative h-[2px] overflow-hidden ${ruleTrack}`}>
        <span className={`omicron-folio-line omicron-folio-line-1 absolute inset-y-0 left-0 w-full ${ruleFill}`} />
      </span>
      <span className={`relative h-[2px] overflow-hidden ${ruleTrack}`}>
        <span className={`omicron-folio-line omicron-folio-line-2 absolute inset-y-0 left-0 w-full ${ruleFill}`} />
      </span>
      <span className={`relative h-[2px] overflow-hidden ${ruleTrack}`}>
        <span className={`omicron-folio-line omicron-folio-line-3 absolute inset-y-0 left-0 w-full ${ruleFill}`} />
      </span>
    </div>
  );

  return (
    <div
      className={`${wrapper} ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={isRow ? "flex items-center gap-4" : "flex flex-col items-center"}>
        {folio}

        <div className={isRow ? "text-left" : "mt-5 text-center"}>
          <p
            className={`font-[family-name:var(--font-display)] text-[11px] font-normal uppercase tracking-[0.28em] ${
              onDark ? "text-[#f3c4b0]" : "text-[var(--accent)]"
            }`}
          >
            Omicron Publications
          </p>
          <p
            className={`mt-2 font-[family-name:var(--font-body)] ${
              isFull ? "text-lg" : "text-base"
            } ${onDark ? "text-white/85" : "text-[var(--muted)]"}`}
          >
            {label ?? "Composing the page…"}
          </p>
        </div>
      </div>
    </div>
  );
}
