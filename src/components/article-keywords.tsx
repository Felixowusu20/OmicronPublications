import Link from "next/link";
import type { CSSProperties } from "react";
import { journalArticlePalette } from "@/lib/journal-colors";

type Props = {
  keywords: string[];
  className?: string;
  /** Journal cover color — tints keyword chips and the section accent. */
  coverColor?: string | null;
  journalSlug?: string;
};

/** Journal-style keyword row with searchable chips tinted by journal color. */
export function ArticleKeywords({
  keywords,
  className = "",
  coverColor,
  journalSlug,
}: Props) {
  if (keywords.length === 0) return null;

  const palette = journalArticlePalette(coverColor, journalSlug || "omicron");

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 ${className}`}
      style={
        {
          borderColor: "var(--line)",
          borderLeftWidth: 3,
          borderLeftColor: palette.primary,
          background: palette.soft,
          "--j-primary": palette.primary,
          "--j-link": palette.link,
          "--j-soft": palette.soft,
        } as CSSProperties
      }
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: palette.primary }}
      >
        Keywords
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-2" role="list">
        {keywords.map((keyword, i) => (
          <li key={`${keyword}-${i}`}>
            <Link
              href={`/search?q=${encodeURIComponent(keyword)}`}
              className="inline-flex rounded-md border bg-white px-2.5 py-1 text-[12px] font-medium shadow-[0_1px_0_rgba(11,31,51,0.04)] transition hover:opacity-90"
              style={{
                borderColor: `${palette.primary}33`,
                color: palette.primary,
              }}
              title={`Search for “${keyword}”`}
            >
              {keyword}
            </Link>
          </li>
        ))}
      </ul>
      <p className="sr-only">{keywords.join(", ")}</p>
    </div>
  );
}
