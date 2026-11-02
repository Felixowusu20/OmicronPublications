"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleListingCard } from "@/components/article-listing-card";
import { publishingWorkflow } from "@/data/mock";
import { matchesQuery } from "@/lib/page-search";
import {
  DEFAULT_GOAL_TABS,
  DEFAULT_GOALS_SECTION,
  type GoalTabContent,
  type HomeSectionContent,
} from "@/lib/home-cms-defaults";

export type HomeGoalTabCard = GoalTabContent & { id?: string };

export type HomeGoalsSection = Pick<
  HomeSectionContent,
  "eyebrow" | "title" | "body"
>;

export type HomeArticle = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  abstract: string;
  articleType: string;
  openAccess: boolean;
  doi: string | null;
  publishedAt: string;
  journalTitle: string;
  journalSlug: string;
  volume?: string;
  issue?: string;
  views: number;
  downloads: number;
  keywords: string[];
  hasPdf: boolean;
};

export type HomeAnnouncement = {
  id: string;
  title: string;
  summary: string;
  href: string | null;
  publishedAt: string;
  imageUrl?: string | null;
};

export type HomeJournal = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  openAccess: boolean;
  doiPrefix: string | null;
  coverImageUrl: string | null;
  coverColor: string;
  description: string;
  subjects: string[];
};

type RemoteArticle = HomeArticle;
type RemoteJournal = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  subjects: string[];
};

type Props = {
  articles: HomeArticle[];
  announcements: HomeAnnouncement[];
  journals: HomeJournal[];
  initialQuery?: string;
  /** IDs already shown in the top “Just published” strip */
  excludeArticleIds?: string[];
  goalTabs?: HomeGoalTabCard[];
  goalsSection?: HomeGoalsSection | null;
};

function articleHaystack(article: HomeArticle) {
  return [
    article.title,
    article.authors.join(" "),
    article.abstract,
    article.doi,
    article.keywords.join(" "),
    article.journalTitle,
    article.articleType,
  ].join(" ");
}

function announcementHaystack(item: HomeAnnouncement) {
  return `${item.title} ${item.summary}`;
}

function journalHaystack(journal: HomeJournal) {
  return [
    journal.title,
    journal.shortTitle,
    journal.doiPrefix,
    journal.description,
    journal.subjects.join(" "),
    journal.openAccess ? "Open Access" : "Subscription",
  ].join(" ");
}

function workflowHaystack(item: (typeof publishingWorkflow)[number]) {
  return `${item.step} ${item.title} ${item.detail} publishing pathway`;
}

function SearchParamsSync({ onQuery }: { onQuery: (value: string) => void }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  useEffect(() => {
    onQuery(q);
  }, [q, onQuery]);
  return null;
}

function HomeCatalogInner({
  articles,
  announcements,
  journals,
  initialQuery = "",
  excludeArticleIds = [],
  goalTabs: goalTabsProp,
  goalsSection,
}: Props) {
  const goalTabs =
    goalTabsProp && goalTabsProp.length > 0
      ? goalTabsProp
      : DEFAULT_GOAL_TABS;
  const goalsHeading = goalsSection ?? DEFAULT_GOALS_SECTION;
  const [q, setQ] = useState(initialQuery);
  const [remoteArticles, setRemoteArticles] = useState<RemoteArticle[]>([]);
  const [remoteJournals, setRemoteJournals] = useState<RemoteJournal[]>([]);
  const [activeGoal, setActiveGoal] = useState(goalTabs[0]?.key ?? "publish");

  useEffect(() => {
    if (!goalTabs.some((tab) => tab.key === activeGoal)) {
      setActiveGoal(goalTabs[0]?.key ?? "publish");
    }
  }, [goalTabs, activeGoal]);

  const needle = q.trim();
  const activeTab =
    goalTabs.find((tab) => tab.key === activeGoal) ?? goalTabs[0];

  const localArticles = useMemo(
    () =>
      needle
        ? articles.filter((article) =>
            matchesQuery(articleHaystack(article), needle),
          )
        : articles,
    [articles, needle],
  );

  const matchedAnnouncements = useMemo(
    () =>
      needle
        ? announcements.filter((item) =>
            matchesQuery(announcementHaystack(item), needle),
          )
        : announcements,
    [announcements, needle],
  );

  const localJournals = useMemo(
    () =>
      needle
        ? journals.filter((journal) =>
            matchesQuery(journalHaystack(journal), needle),
          )
        : journals,
    [journals, needle],
  );

  const matchedWorkflow = useMemo(
    () =>
      needle
        ? publishingWorkflow.filter((item) =>
            matchesQuery(workflowHaystack(item), needle),
          )
        : publishingWorkflow,
    [needle],
  );

  const ctaMatches =
    !needle ||
    matchesQuery(
      "For authors Ready to submit Create an account choose a journal track manuscript peer review DOI assignment publication Register Start submission Be part of what comes next",
      needle,
    );

  useEffect(() => {
    if (!needle) {
      setRemoteArticles([]);
      setRemoteJournals([]);
      return;
    }

    const handle = window.setTimeout(() => {
      const params = new URLSearchParams({ q: needle, type: "all" });
      void fetch(`/api/search?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setRemoteArticles((data.articles ?? []) as RemoteArticle[]);
          setRemoteJournals((data.journals ?? []) as RemoteJournal[]);
        })
        .catch(() => {
          setRemoteArticles([]);
          setRemoteJournals([]);
        });
    }, 180);

    return () => window.clearTimeout(handle);
  }, [needle]);

  const displayedArticles = (() => {
    const merged = needle
      ? mergeArticles(localArticles, remoteArticles)
      : articles;
    if (needle || excludeArticleIds.length === 0) return merged;
    const skip = new Set(excludeArticleIds);
    return merged.filter((a) => !skip.has(a.id));
  })();

  const displayedJournals = needle
    ? mergeJournals(localJournals, remoteJournals, journals)
    : journals;

  const showWorkflow = !needle || matchedWorkflow.length > 0;
  const showGoals = !needle;

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsSync onQuery={setQ} />
      </Suspense>

      <div id="home-results" className="scroll-mt-28" />

      {showGoals ? (
        <section
          className="border-b border-[var(--line)] bg-[var(--paper)]"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-start">
              <div>
                <h2 className="acs-section-title">
                  {goalsHeading.title === "Find the right resources for your goals"
                    ? "Start with Omicron"
                    : goalsHeading.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                  {goalsHeading.body?.includes("every stage of scholarly communication")
                    ? "Submit a paper, choose a journal, or read open research — pick the path that matches what you need next."
                    : goalsHeading.body}
                </p>

                <div
                  className="mt-8 flex flex-col border-t border-[var(--line)]"
                  role="tablist"
                  aria-label="Quick start paths"
                >
                  {goalTabs.map((tab) => {
                    const selected = tab.key === activeGoal;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActiveGoal(tab.key)}
                        className={`flex items-center justify-between gap-3 border-b border-[var(--line)] px-1 py-4 text-left transition ${
                          selected
                            ? "text-[var(--accent)]"
                            : "text-[var(--ink)] hover:text-[var(--accent)]"
                        }`}
                      >
                        <span className="text-lg font-semibold sm:text-xl">
                          {tab.label}
                        </span>
                        <span
                          className={`text-sm transition ${
                            selected ? "translate-x-0.5 text-[var(--accent)]" : "text-[var(--muted)]"
                          }`}
                          aria-hidden
                        >
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                role="tabpanel"
                key={activeTab.key}
                className="home-goal-panel border border-[var(--line)] bg-[var(--surface)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[var(--ink)]">
                  <Image
                    key={activeTab.imageUrl}
                    src={activeTab.imageUrl}
                    alt={activeTab.imageAlt || activeTab.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-[var(--ink)] sm:text-2xl">
                    {activeTab.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
                    {activeTab.body}
                  </p>
                  <ul className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {activeTab.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a83f1f]"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="border-b border-[var(--line)] bg-[var(--surface)]"
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="acs-section-title">News and more papers</h2>
            </div>
            <Link
              href="/articles"
              className="text-[15px] font-medium text-[var(--accent)] underline underline-offset-4"
            >
              All articles
            </Link>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Announcements
              </h3>
              <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {matchedAnnouncements.length === 0 ? (
                  <li className="py-6 text-sm text-[var(--muted)]">
                    No announcements yet.
                  </li>
                ) : (
                  matchedAnnouncements.slice(0, 5).map((item) => {
                    const body = (
                      <div className="py-5">
                        <p className="text-xs text-[var(--muted)]">{item.publishedAt}</p>
                        <p className="mt-1.5 text-lg font-semibold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)]">
                          {item.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                          {item.summary}
                        </p>
                      </div>
                    );
                    return (
                      <li key={item.id}>
                        {item.href ? (
                          <Link href={item.href} className="group block">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                More published work
              </h3>
              <div className="mt-4 space-y-3">
                {displayedArticles.length === 0 ? (
                  <p className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">
                    {needle
                      ? "No matching articles on this page."
                      : articles.length > 0
                        ? "The newest papers are featured above."
                        : "No published articles yet."}
                    {!needle && articles.length > 0 ? (
                      <>
                        {" "}
                        <Link
                          href="/articles"
                          className="font-semibold text-[var(--accent)] hover:underline"
                        >
                          Browse the catalog →
                        </Link>
                      </>
                    ) : null}
                  </p>
                ) : (
                  displayedArticles.map((article, index) => (
                    <ArticleListingCard
                      key={article.id || article.slug}
                      compact
                      aosDelay={Math.min(index * 70, 280)}
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showWorkflow ? (
        <section
          className="border-b border-[var(--line)] bg-[var(--paper)]"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="acs-section-title">
                How a paper moves through Omicron
              </h2>
            </div>

            <ol className="mt-10 space-y-0 border-t border-[var(--line)]">
              {(needle ? matchedWorkflow : publishingWorkflow).map(
                (item, index) => (
                  <li
                    key={item.step}
                    className="grid gap-3 border-b border-[var(--line)] py-6 sm:grid-cols-[5rem_1fr_1.2fr] sm:gap-8 sm:items-start"
                    data-aos="fade-up"
                    data-aos-delay={String(40 + index * 50)}
                  >
                    <p className="text-sm font-semibold tracking-[0.14em] text-[var(--accent)]">
                      {String(item.step).padStart(2, "0")}
                    </p>
                    <h3 className="text-lg font-bold text-[var(--ink)] sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                      {item.detail}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>
      ) : null}

      {(!needle || displayedJournals.length > 0) && (
        <section
          className="border-b border-[var(--line)] bg-white"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="acs-section-title">Journals</h2>
                <p className="mt-2 text-[1.05rem] text-[var(--muted)]">
                  Browse Omicron titles by abbreviation, scope, and open-access
                  status.
                </p>
              </div>
              <Link
                href="/journals"
                className="text-[15px] font-medium text-[var(--accent)] underline underline-offset-4"
              >
                View all journals
              </Link>
            </div>

            {displayedJournals.length === 0 ? (
              <p className="mt-8 border-y border-[var(--line)] py-6 text-[1.05rem] text-[var(--muted)]">
                Add journals in the admin CMS.
              </p>
            ) : (
              <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {displayedJournals.map((journal) => (
                  <li key={journal.id}>
                    <Link
                      href={`/journals/${journal.slug}`}
                      className="group grid gap-2 py-5 transition sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
                    >
                      <span className="font-mono text-sm font-semibold tracking-wide text-[var(--accent)]">
                        {journal.shortTitle}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[1.1rem] font-semibold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] sm:text-[1.2rem]">
                          {journal.title}
                        </span>
                        {journal.subjects.length > 0 ? (
                          <span className="mt-1 block text-[0.95rem] text-[var(--muted)]">
                            {journal.subjects.slice(0, 4).join(" · ")}
                          </span>
                        ) : journal.description ? (
                          <span className="mt-1 block line-clamp-1 text-[0.95rem] text-[var(--muted)]">
                            {journal.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm font-medium text-[var(--muted)] group-hover:text-[var(--accent)] sm:text-right">
                        {journal.openAccess ? "Open access" : "Subscription"}
                        <span className="ml-2 inline-block transition group-hover:translate-x-0.5" aria-hidden>
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {ctaMatches ? (
        <section
          className="border-b border-[var(--line)] bg-white"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="border-l-4 border-[var(--accent)] pl-5 sm:pl-7">
              <h2 className="acs-section-title">
                Ready to send your manuscript?
              </h2>
              <p className="mt-3 max-w-2xl text-[1.1rem] leading-relaxed text-[var(--muted)] sm:text-[1.2rem]">
                Open an author account and start a submission in a few steps.
                Track review status from your dashboard.
              </p>
              <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
                <li>
                  <Link
                    href="/submissions/new"
                    className="acs-subject-link text-[1.1rem] font-semibold"
                  >
                    Start submission →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-[1.1rem] font-semibold text-[var(--ink)] underline underline-offset-4 decoration-[var(--line)] transition hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
                  >
                    Create account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/authors/guidelines"
                    className="text-[1.05rem] font-medium text-[var(--muted)] underline underline-offset-4 decoration-[var(--line)] transition hover:text-[var(--accent)]"
                  >
                    Author guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function mergeArticles(local: HomeArticle[], remote: RemoteArticle[]) {
  const bySlug = new Map<string, HomeArticle>();
  for (const article of [...local, ...remote]) {
    if (!bySlug.has(article.slug)) bySlug.set(article.slug, article);
  }
  return [...bySlug.values()];
}

function mergeJournals(
  local: HomeJournal[],
  remote: RemoteJournal[],
  source: HomeJournal[],
) {
  const bySlug = new Map<string, HomeJournal>();
  for (const journal of local) bySlug.set(journal.slug, journal);
  for (const journal of remote) {
    if (bySlug.has(journal.slug)) continue;
    const existing = source.find((item) => item.slug === journal.slug);
    bySlug.set(
      journal.slug,
      existing ?? {
        id: journal.id,
        slug: journal.slug,
        title: journal.title,
        shortTitle: journal.shortTitle ?? "",
        openAccess: true,
        doiPrefix: null,
        coverImageUrl: null,
        coverColor: "",
        description: "",
        subjects: journal.subjects,
      },
    );
  }
  return [...bySlug.values()];
}

export function HomeCatalog(props: Props) {
  return <HomeCatalogInner {...props} />;
}
