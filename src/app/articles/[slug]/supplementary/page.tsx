import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OmicronArticleTemplate } from "@/components/atlas-article-template";
import { prisma } from "@/lib/db";
import { ensureManuscriptHtml } from "@/lib/import-manuscript";
import { formatArticleDate } from "@/lib/article-dates";
import { resolveArticleIssue } from "@/lib/issues";
import {
  hasSupplementaryContent,
  resolveSupplementaryHtml,
} from "@/lib/supplementary";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await prisma.publishedArticle.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: { title: true },
    });
    if (article) {
      return {
        title: `Supplementary materials — ${article.title} | Omicron Publications`,
        robots: { index: true, follow: true },
      };
    }
  } catch (err) {
    console.error("[supplementary-metadata]", err);
  }
  return { title: "Supplementary materials | Omicron Publications" };
}

export default async function ArticleSupplementaryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.publishedArticle.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      journal: true,
      submission: {
        select: {
          productionBody: true,
          productionSupplementary: true,
          productionSupplementaryUrl: true,
        },
      },
    },
  });

  if (!article) notFound();

  const html = ensureManuscriptHtml(
    resolveSupplementaryHtml({
      supplementary:
        article.supplementaryHtml ??
        article.submission?.productionSupplementary,
      body: article.submission?.productionBody,
    }),
  );
  const fileUrl =
    article.supplementaryUrl?.trim() ||
    article.submission?.productionSupplementaryUrl?.trim() ||
    null;

  if (!hasSupplementaryContent({ html, url: fileUrl })) {
    notFound();
  }

  const numbered = resolveArticleIssue({
    volume: article.volume,
    issue: article.issue,
    publishedAt: article.publishedAt,
    frequency: article.journal.frequency,
    foundedYear: article.journal.foundedYear,
  });

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Supporting information
            </p>
            <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
              Bound to this article only
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/articles/${article.slug}`}
              className="btn-secondary !px-3 !py-2 text-xs"
            >
              ← Back to article
            </Link>
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !px-3 !py-2 text-xs"
              >
                Open supplementary file
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5 rounded-xl border border-[var(--line)] bg-white px-4 py-4 sm:px-5">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] sm:text-2xl">
            Supplementary materials
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            For{" "}
            <Link
              href={`/articles/${article.slug}`}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              {article.title}
            </Link>{" "}
            · {article.journal.title}
          </p>
        </div>

        {html.trim() ? (
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
            <OmicronArticleTemplate
              wide
              journalTitle={article.journal.title}
              journalShortTitle={article.journal.shortTitle}
              journalSlug={article.journal.slug}
              coverColor={article.journal.coverColor}
              journalUrl={`/journals/${article.journal.slug}`}
              articleUrl={`/articles/${article.slug}`}
              manuscriptId={article.slug}
              title={`${article.title} — Supplementary materials`}
              authors={article.authors}
              affiliations={article.affiliations}
              abstract="Supporting information published with this article."
              body={html}
              keywords={article.keywords}
              articleType="Supplementary"
              doi={article.doi ?? undefined}
              volume={numbered.volume}
              issue={numbered.issue}
              pages={article.pages ?? undefined}
              license={article.license ?? "CC BY 4.0"}
              openAccess={article.openAccess}
              logoUrl={
                article.coverImageUrl ?? article.journal.coverImageUrl ?? null
              }
              publishedAt={formatArticleDate(article.publishedAt)}
              receivedAt={formatArticleDate(article.receivedAt)}
              acceptedAt={formatArticleDate(article.acceptedAt)}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--line)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
            Supplementary content for this article is provided as a downloadable
            file.
            {fileUrl ? (
              <p className="mt-4">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex text-sm"
                >
                  Open supplementary file
                </a>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
