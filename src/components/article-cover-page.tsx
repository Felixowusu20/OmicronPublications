import type { CSSProperties } from "react";
import {
  darkenHex,
  journalArticlePalette,
  lightenHex,
} from "@/lib/journal-colors";

export type ArticleCoverPageProps = {
  journalTitle: string;
  journalShortTitle: string;
  coverColor?: string | null;
  journalSlug?: string;
  issn?: string | null;
  eIssn?: string | null;
  articleTitle?: string;
  authors?: string[];
  articleType?: string;
  volume?: string;
  issue?: string;
  year?: string;
  openAccess?: boolean;
  /** Uploaded journal cover / logo — shown as cover art when present. */
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  /** When false, omit the page break (e.g. card thumbnails). */
  pageBreak?: boolean;
  className?: string;
};

/**
 * Auto-generated professional article cover — journal color, compact brand
 * marks, title block, and publisher footer.
 */
export function ArticleCoverPage({
  journalTitle,
  journalShortTitle,
  coverColor,
  journalSlug,
  issn,
  eIssn,
  articleTitle,
  authors = [],
  articleType,
  volume,
  issue,
  year,
  openAccess = true,
  coverImageUrl: _coverImageUrl,
  logoUrl: _logoUrl,
  pageBreak = true,
  className = "",
}: ArticleCoverPageProps) {
  void _coverImageUrl;
  void _logoUrl;
  const palette = journalArticlePalette(
    coverColor,
    journalSlug || journalShortTitle || "omicron",
  );
  const deep = darkenHex(palette.primary, 0.42);
  const mid = darkenHex(palette.primary, 0.18);
  const glow = lightenHex(palette.primary, 0.22);
  const issnLine = eIssn
    ? `e-ISSN: ${eIssn}`
    : issn
      ? `ISSN: ${issn}`
      : null;
  const authorsLine = authors.filter(Boolean).slice(0, 6).join(", ");
  const metaBits = [
    year || null,
    volume ? `Vol. ${volume}` : null,
    issue ? `Issue ${issue}` : null,
  ].filter(Boolean);

  return (
    <section
      className={`omicron-article-cover ${pageBreak ? "omicron-article-cover--paged" : ""} ${className}`}
      style={
        {
          "--cover-deep": deep,
          "--cover-mid": mid,
          "--cover-glow": glow,
          "--cover-primary": palette.primary,
          "--cover-soft": palette.soft,
          background: `radial-gradient(ellipse 70% 55% at 88% 28%, ${glow}40 0%, transparent 58%),
            linear-gradient(155deg, ${deep} 0%, ${mid} 48%, ${deep} 100%)`,
        } as CSSProperties
      }
      aria-label={`${journalTitle} cover`}
    >
      <div className="omicron-article-cover__frame" aria-hidden />
      <div className="omicron-article-cover__motif" aria-hidden>
        <span className="omicron-article-cover__grid" />
      </div>

      <div className="omicron-article-cover__inner">
        <div className="omicron-article-cover__top">
          <div className="omicron-article-cover__brandrow">
            <div className="omicron-article-cover__mark-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mark-omicron.png"
                alt="Omicron Publications"
              />
            </div>
            {openAccess ? (
              <span className="omicron-article-cover__oa">Open Access</span>
            ) : null}
          </div>

          <h1 className="omicron-article-cover__journal">
            {journalTitle || journalShortTitle || "Omicron Journal"}
          </h1>
          {issnLine ? (
            <p className="omicron-article-cover__issn">{issnLine}</p>
          ) : null}
        </div>

        <div className="omicron-article-cover__article">
          {articleType ? (
            <p className="omicron-article-cover__type">
              {articleType.replace(/\s+Article$/i, "").trim() || "Article"}
            </p>
          ) : null}
          {articleTitle ? (
            <h2 className="omicron-article-cover__title">{articleTitle}</h2>
          ) : null}
          {authorsLine ? (
            <p className="omicron-article-cover__authors">{authorsLine}</p>
          ) : null}
          {metaBits.length > 0 ? (
            <p className="omicron-article-cover__meta">{metaBits.join(" · ")}</p>
          ) : null}
        </div>

        <footer className="omicron-article-cover__foot">
          <div className="omicron-article-cover__foot-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mark-omicron.png"
              alt=""
              className="omicron-article-cover__foot-mark"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-omicron-on-dark.png"
              alt="Omicron Publications"
              className="omicron-article-cover__foot-logo"
            />
          </div>
          <p className="omicron-article-cover__foot-label">
            Omicron Publications
          </p>
        </footer>
      </div>
    </section>
  );
}
