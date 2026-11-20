import Link from "next/link";
import { ArticleCoverPage } from "@/components/article-cover-page";
import { journalCardColor } from "@/lib/journal-colors";

export type JournalImageCardData = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  openAccess: boolean;
  coverImageUrl?: string | null;
  coverColor?: string | null;
  subjects?: string[];
  issn?: string | null;
  eIssn?: string | null;
};

type Props = {
  journal: JournalImageCardData;
  index?: number;
  /** Visual variant for light or dark page backgrounds */
  tone?: "light" | "dark";
  aosDelay?: number;
};

/**
 * Full-bleed cover-style journal card — uploaded image or auto-generated cover.
 */
export function JournalImageCard({
  journal,
  index = 0,
  tone = "light",
  aosDelay = 0,
}: Props) {
  const color = journalCardColor(journal.coverColor ?? "", index);
  const dark = tone === "dark";
  const hasUpload = Boolean(journal.coverImageUrl?.trim());

  return (
    <Link
      href={`/journals/${journal.slug}`}
      className={`group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl ${
        dark
          ? "ring-white/15 hover:ring-emerald-200/40"
          : "bg-white ring-[var(--line)] hover:ring-[var(--accent)]/35"
      }`}
      data-aos="fade-up"
      data-aos-delay={aosDelay || undefined}
      data-aos-duration="900"
      aria-label={journal.title}
    >
      <div
        className="absolute inset-0"
        style={hasUpload ? { background: "#f3f5f8" } : { background: color }}
      >
        {hasUpload ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={journal.coverImageUrl!}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <ArticleCoverPage
            journalTitle={journal.title}
            journalShortTitle={journal.shortTitle}
            coverColor={journal.coverColor || color}
            journalSlug={journal.slug}
            issn={journal.issn}
            eIssn={journal.eIssn}
            openAccess={journal.openAccess}
            coverImageUrl={journal.coverImageUrl}
            pageBreak={false}
            className="!min-h-0 !aspect-auto h-full rounded-none [&_.omicron-article-cover__article]:hidden [&_.omicron-article-cover__frame]:inset-[6px] [&_.omicron-article-cover__inner]:gap-3 [&_.omicron-article-cover__inner]:p-3 sm:[&_.omicron-article-cover__inner]:p-4 [&_.omicron-article-cover__journal]:mt-2 [&_.omicron-article-cover__journal]:max-w-none [&_.omicron-article-cover__journal]:text-[0.72rem] sm:[&_.omicron-article-cover__journal]:text-[0.85rem] [&_.omicron-article-cover__issn]:text-[0.6rem] [&_.omicron-article-cover__foot-label]:hidden"
          />
        )}
      </div>

      {hasUpload ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-14 sm:p-4 sm:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200 sm:text-[11px]">
            {journal.openAccess ? "Open access" : "Subscription"}
          </p>
          <h3 className="mt-0.5 line-clamp-3 font-[family-name:var(--font-display)] text-sm font-semibold leading-snug text-white sm:mt-1 sm:text-lg">
            {journal.title}
          </h3>
          {journal.subjects && journal.subjects.length > 0 ? (
            <p className="mt-0.5 hidden line-clamp-1 text-xs text-white/70 sm:mt-1 sm:block">
              {journal.subjects.slice(0, 3).join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
