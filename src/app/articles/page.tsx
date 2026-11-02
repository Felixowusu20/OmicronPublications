import { ArticleListingCard } from "@/components/article-listing-card";
import { ArticlesHubNav } from "@/components/articles-hub-nav";
import { prisma } from "@/lib/db";
import {
  fieldById,
  fieldIdForBrowseLabel,
  journalMatchesField,
  RESEARCH_FIELDS,
} from "@/lib/research-fields";
import { resolvePublishedPdfUrl } from "@/lib/submission-utils";
import { resolveArticleIssue } from "@/lib/issues";

export const dynamic = "force-dynamic";

type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  abstract: string;
  articleType: string;
  openAccess: boolean;
  volume: string;
  issue: string;
  doi: string;
  publishedAt: string;
  journalTitle: string;
  journalSlug: string;
  journalSubjects: string[];
  views: number;
  downloads: number;
  keywords: string[];
  hasPdf: boolean;
};

async function getArticles(): Promise<ArticleCard[]> {
  try {
    const rows = await prisma.publishedArticle.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        journal: true,
        submission: { select: { manuscriptUrl: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map((a) => {
      const numbered = resolveArticleIssue({
        volume: a.volume,
        issue: a.issue,
        publishedAt: a.publishedAt,
        frequency: a.journal.frequency,
        foundedYear: a.journal.foundedYear,
      });
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        authors: a.authors,
        abstract: a.abstract,
        articleType: a.articleType,
        openAccess: a.openAccess,
        volume: numbered.volume,
        issue: numbered.issue,
        doi: a.doi ?? "Pending",
        publishedAt: a.publishedAt.toISOString().slice(0, 10),
        journalTitle: a.journal.title,
        journalSlug: a.journal.slug,
        journalSubjects: a.journal.subjects ?? [],
        views: a.views,
        downloads: a.downloads,
        keywords: a.keywords,
        hasPdf: Boolean(
          resolvePublishedPdfUrl(a.manuscriptUrl, a.submission?.manuscriptUrl),
        ),
      };
    });
  } catch {
    return [];
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string; field?: string; subject?: string }>;
}) {
  const { access, field: fieldParam, subject: subjectParam } =
    await searchParams;
  const all = await getArticles();

  const resolvedFieldId =
    fieldParam?.trim() ||
    (subjectParam ? fieldIdForBrowseLabel(subjectParam) : null);
  const fieldDef = resolvedFieldId ? fieldById(resolvedFieldId) : null;

  let list = access === "oa" ? all.filter((a) => a.openAccess) : all;

  if (fieldDef) {
    list = list.filter((a) =>
      journalMatchesField(
        {
          slug: a.journalSlug,
          title: a.journalTitle,
          subjects: a.journalSubjects,
        },
        fieldDef,
      ),
    );
  } else if (subjectParam?.trim()) {
    const needle = subjectParam.trim().toLowerCase();
    list = list.filter((a) =>
      a.journalSubjects.some((s) => s.toLowerCase().includes(needle)),
    );
  }

  const filterLabel =
    fieldDef?.label ||
    subjectParam?.trim() ||
    (access === "oa" ? "Open access" : null);

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_rgba(200,78,39,0.07),_transparent_60%)]"
        aria-hidden
      />

      <div className="relative page-wrap">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Omicron journals
            </p>
            <h1 className="page-title mt-1">
              {filterLabel ? `${filterLabel} articles` : "Articles"}
            </h1>
            <p className="mt-2 text-[1.05rem] leading-relaxed text-[var(--muted)]">
              {fieldDef
                ? `Papers published in journals tagged for ${fieldDef.label}. The journal chosen at submission binds each article to this field.`
                : "Published articles by journal issue. Each paper counts toward the volume and issue number set from its publication date."}
            </p>
            {fieldDef ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Related subjects:{" "}
                {fieldDef.aliases
                  .slice(0, 5)
                  .map((a) => a.replace(/\b\w/g, (c) => c.toUpperCase()))
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          <ArticlesHubNav active={access === "oa" ? "oa" : "all"} />
        </div>

        {!fieldDef && !subjectParam ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {RESEARCH_FIELDS.map((f) => (
              <a
                key={f.id}
                href={`/articles?field=${f.id}`}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {f.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4">
            <a
              href="/articles"
              className="text-[15px] font-medium text-[var(--accent)] underline underline-offset-4"
            >
              ← All articles
            </a>
          </p>
        )}

        <div className="mt-8 w-full min-w-0 space-y-4">
          {list.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-[1.05rem] text-[var(--muted)] ring-1 ring-[var(--line)]">
              {fieldDef || subjectParam
                ? "No published articles in this field yet. When authors submit to a matching journal and the paper is published, it will appear here."
                : "No articles published yet."}
            </p>
          )}
          {list.map((article) => (
            <ArticleListingCard
              key={article.id}
              article={{
                slug: article.slug,
                title: article.title,
                authors: article.authors,
                abstract: article.abstract,
                articleType: article.articleType,
                openAccess: article.openAccess,
                doi: article.doi,
                publishedAt: article.publishedAt,
                journalTitle: article.journalTitle,
                journalSlug: article.journalSlug,
                volume: article.volume,
                issue: article.issue,
                views: article.views,
                downloads: article.downloads,
                keywords: article.keywords,
                hasPdf: article.hasPdf,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
