import Image from "next/image";
import Link from "next/link";
import { formatVolumeIssue } from "@/lib/article-preview-image";
import {
  DEFAULT_INDEXED_PLATFORMS,
  DEFAULT_INDEXED_SECTION,
} from "@/lib/home-cms-defaults";
import { authorDisplayName } from "@/lib/orcid";
import { htmlToPlainText } from "@/lib/import-manuscript";

export type RecentArticleCard = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  abstract: string;
  articleType: string;
  openAccess: boolean;
  publishedAt: string;
  journalTitle: string;
  journalSlug: string;
  volume?: string;
  issue?: string;
  imageUrl?: string | null;
};

export type RecentIndexedPlatform = {
  id?: string;
  name: string;
  blurb: string;
  href: string;
  logoUrl: string;
};

export type RecentIndexedSection = {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
};

type Props = {
  articles: RecentArticleCard[];
  platforms?: RecentIndexedPlatform[];
  indexedSection?: RecentIndexedSection | null;
};

function typeLabel(articleType: string) {
  return (
    (articleType || "Article").replace(/\s+Article$/i, "").trim() || "Article"
  );
}

function authorLine(names: string[], limit = 3) {
  return (
    names.slice(0, limit).map(authorDisplayName).join(", ") +
    (names.length > limit ? " et al." : "")
  );
}

/**
 * Nature-style research highlights: one lead story + a quiet reading list.
 */
export function HomeRecentArticles({
  articles,
  platforms: platformsProp,
  indexedSection,
}: Props) {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;
  const side = rest.slice(0, 4);
  const featuredMeta = [
    featured.journalTitle,
    formatVolumeIssue(featured.volume, featured.issue),
  ]
    .filter(Boolean)
    .join(" · ");

  const platforms =
    platformsProp && platformsProp.length > 0
      ? platformsProp
      : DEFAULT_INDEXED_PLATFORMS.map((p, i) => ({
          id: `default-${i}`,
          name: p.name,
          blurb: p.blurb,
          href: p.href,
          logoUrl: p.logoUrl,
        }));
  const section = indexedSection ?? DEFAULT_INDEXED_SECTION;

  return (
    <section
      className="nature-section border-b border-[var(--line)] bg-[var(--paper)]"
      aria-label="Research highlights"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="acs-section-title">Latest from the journals</h2>
          </div>
          <Link
            href="/articles"
            className="shrink-0 text-[15px] font-medium text-[var(--accent)] underline underline-offset-4"
          >
            Browse all research
          </Link>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.35fr_0.9fr] lg:gap-14">
          <Link
            href={`/articles/${featured.slug}`}
            className="group block"
            data-aos="fade-up"
            data-aos-duration="900"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface)]">
              {featured.imageUrl ? (
                <Image
                  src={featured.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  unoptimized
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a5a 0%, #c84e27 100%)",
                  }}
                />
              )}
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {typeLabel(featured.articleType)}
                {featured.openAccess ? " · Open access" : ""}
              </p>
              <h3 className="mt-2 text-2xl font-bold leading-snug text-[var(--ink)] transition group-hover:text-[var(--accent)] sm:text-[1.75rem]">
                {featured.title}
              </h3>
              <p className="mt-3 text-sm font-medium text-[var(--muted)]">
                {authorLine(featured.authors)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {featuredMeta}
                <span className="text-[var(--line)]"> · </span>
                {featured.publishedAt}
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
                {htmlToPlainText(featured.abstract).trim().slice(0, 220) ||
                  typeLabel(featured.articleType)}
                {htmlToPlainText(featured.abstract).trim().length > 220
                  ? "…"
                  : ""}
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                Read the paper
              </span>
            </div>
          </Link>

          <div
            className="flex flex-col"
            data-aos="fade-up"
            data-aos-delay="80"
            data-aos-duration="900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Also this week
            </p>
            <ul className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {side.length === 0 ? (
                <li className="py-8 text-sm text-[var(--muted)]">
                  More papers will appear here as they are published.
                </li>
              ) : (
                side.map((article) => {
                  const meta = [
                    article.journalTitle,
                    formatVolumeIssue(article.volume, article.issue),
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li key={article.id}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="group flex gap-4 py-5 transition"
                      >
                        <div className="relative hidden h-20 w-24 shrink-0 overflow-hidden bg-[var(--surface)] sm:block">
                          {article.imageUrl ? (
                            <Image
                              src={article.imageUrl}
                              alt=""
                              fill
                              className="object-cover transition duration-500 group-hover:scale-[1.03]"
                              sizes="96px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-navy)] to-[var(--accent)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                            {typeLabel(article.articleType)}
                          </p>
                          <h3 className="mt-1.5 text-lg font-semibold leading-snug text-[var(--ink)] transition group-hover:text-[var(--accent)]">
                            {article.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-1 text-sm text-[var(--muted)]">
                            {authorLine(article.authors, 2)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {meta}
                            {meta ? " · " : ""}
                            {article.publishedAt}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="mt-auto border-t border-[var(--line)] pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {section.eyebrow || "Discoverable"}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                {section.title}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-4">
                {platforms.map((platform, index) => (
                  <li key={platform.id ?? `${platform.name}-${index}`}>
                    <Link
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 transition hover:border-[var(--accent)]/40"
                      title={platform.name}
                    >
                      <Image
                        src={platform.logoUrl}
                        alt={platform.name}
                        width={96}
                        height={36}
                        className="h-7 w-auto max-w-[88px] object-contain"
                        unoptimized
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
