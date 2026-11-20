"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArticleCoverPage } from "@/components/article-cover-page";
import { AuthorOrcidLine } from "@/components/orcid-id";
import { JournalAbbrMark } from "@/components/journal-abbr-mark";
import { TemplateEditable } from "@/components/template-editable";
import { journalArticlePalette } from "@/lib/journal-colors";
import { ensureManuscriptHtml } from "@/lib/import-manuscript";
import { buildApaCitation } from "@/lib/apa-citation";
import { authorDisplayName } from "@/lib/orcid";

export type TemplateEditableFields = {
  title?: string;
  authorsText?: string;
  affiliationsText?: string;
  abstract?: string;
  body?: string;
  keywordsText?: string;
  articleType?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  correspondingEmail?: string;
  funding?: string;
  conflictOfInterest?: string;
};

type Props = {
  journalTitle: string;
  journalShortTitle: string;
  manuscriptId: string;
  title: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  articleType: string;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  license?: string;
  openAccess?: boolean;
  /** Optional journal cover / logo image used on the generated cover page. */
  logoUrl?: string | null;
  issn?: string | null;
  eIssn?: string | null;
  publishedAt?: string;
  receivedAt?: string;
  acceptedAt?: string;
  revisedAt?: string;
  correspondingEmail?: string | null;
  body?: string;
  /** When set, replaces the static body — used for in-template editing. */
  bodySlot?: ReactNode;
  funding?: string | null;
  conflictOfInterest?: string | null;
  journalSlug?: string;
  coverColor?: string;
  articleUrl?: string;
  journalUrl?: string;
  /** Wider page for the publish workspace canvas. */
  wide?: boolean;
  /**
   * Click-to-type on the live journal page (title, authors, abstract, …).
   * Body editing still uses `bodySlot` / ManuscriptEditor.
   */
  editable?: boolean;
  onEditableChange?: (patch: TemplateEditableFields) => void;
};

function AbstractHtml({ abstract }: { abstract: string }) {
  const html = ensureManuscriptHtml(abstract);
  if (!html) {
    return <p>Abstract will appear here.</p>;
  }
  return (
    <div
      className="omicron-abstract-html"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ArticleBodyHtml({ body }: { body?: string }) {
  if (!body?.trim()) return null;
  const html = ensureManuscriptHtml(body);
  if (!html) return null;
  return (
    <div
      className="omicron-article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Collapse textarea/Word line breaks so the abstract can justify as one block. */
function reflowArticleText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function articleTypeDisplay(typeLabel: string) {
  if (typeLabel.length > 22) return "Research Article";
  if (/article/i.test(typeLabel)) return typeLabel;
  return `${typeLabel} Article`;
}

function RunningFooter({
  year,
  doiHref,
  doiLabel,
  journalTitle,
  journalShortTitle,
  citeBits,
}: {
  year: string;
  doiHref: string;
  doiLabel: string;
  journalTitle: string;
  journalShortTitle: string;
  citeBits: string[];
}) {
  return (
    <footer className="omicron-running-footer">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-omicron.png" alt="Omicron Publications" />
          <p className="text-[10px] leading-snug text-[#5b6b7c]">
            © {year} The Authors. Published by Omicron Publications
          </p>
        </div>
        <div className="flex min-w-0 items-end justify-end gap-3 sm:max-w-[55%]">
          <div className="min-w-0 text-left sm:text-right">
            <a
              href={doiHref}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[11px] font-medium hover:underline"
              style={{ color: "var(--j-link)" }}
            >
              {doiLabel}
            </a>
            <p className="mt-0.5 text-[10px] text-[#0b1f33]">
              <em>{journalShortTitle || journalTitle || "Journal"}</em>
              {citeBits.length > 0 ? ` ${citeBits.join(", ")}` : ` ${year}`}
            </p>
          </div>
          <span className="omicron-print-folio" aria-hidden />
        </div>
      </div>
    </footer>
  );
}

/**
 * Omicron journal article template — adapted from the SAUCIS LaTeX layout.
 * Header, authors, abstract, and keywords come from this journal's template;
 * the body is imported HTML tinted with the journal palette.
 */
export function OmicronArticleTemplate({
  journalTitle,
  journalShortTitle,
  manuscriptId,
  title,
  authors,
  affiliations,
  abstract,
  keywords,
  articleType,
  doi,
  volume,
  issue,
  pages,
  license = "CC BY 4.0",
  openAccess = true,
  logoUrl,
  issn,
  eIssn,
  publishedAt,
  receivedAt,
  acceptedAt,
  revisedAt,
  correspondingEmail,
  body,
  bodySlot,
  funding,
  conflictOfInterest,
  journalSlug,
  coverColor,
  articleUrl,
  journalUrl,
  wide = false,
  editable = false,
  onEditableChange,
}: Props) {
  const palette = journalArticlePalette(
    coverColor,
    journalSlug || journalShortTitle || "omicron",
  );
  const typeLabel =
    (articleType || "Research Article").replace(/\s+Article$/i, "") ||
    "Research";
  const typeShown = articleTypeDisplay(typeLabel);
  const authorsPlain = authors
    .map(authorDisplayName)
    .filter(Boolean)
    .join(", ");
  const affiliationsText = affiliations.join("\n");
  const keywordsText = keywords.join(", ");
  const corrEmail = (correspondingEmail || "").trim();
  const fundingText = (funding || "").trim();
  const coiText = (conflictOfInterest || "").trim();

  const patch = (fields: TemplateEditableFields) => {
    onEditableChange?.(fields);
  };

  const yearMatch = publishedAt?.match(/\b(19|20)\d{2}\b/);
  const parsedPublish = publishedAt ? new Date(publishedAt) : null;
  const year = (
    yearMatch?.[0] ||
    (parsedPublish && !Number.isNaN(parsedPublish.getTime())
      ? String(parsedPublish.getFullYear())
      : String(new Date().getFullYear()))
  );
  const citeBits = [year, volume || null, pages || null].filter(
    (b): b is string => Boolean(b),
  );

  const doiHref = doi
    ? `/nid/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").replace(/^nid:\s*/i, "")}`
    : "#";
  const doiLabel = doi
    ? doi.startsWith("http")
      ? doi
      : doi
    : "NID pending";
  const jUrl =
    journalUrl ||
    (journalSlug ? `/journals/${journalSlug}` : "/journals");
  const licenseHref = "https://creativecommons.org/licenses/by/4.0/";
  const licenseLabel = license.replace(/\s+/g, "-");

  const journalPathLabel = (() => {
    if (!jUrl || jUrl === "/journals" || jUrl.startsWith("/")) {
      return journalShortTitle || journalTitle || "Journal";
    }
    try {
      const u = new URL(jUrl);
      const host = u.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local")
      ) {
        return journalShortTitle || journalTitle || "Journal";
      }
      return `${u.host}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return journalShortTitle || journalTitle || "Journal";
    }
  })();

  const apa = buildApaCitation({
    authors,
    title,
    journalTitle,
    publishedAt,
    volume,
    issue,
    pages,
    doi,
  }).text;

  const abbr = (journalShortTitle || "OJ").slice(0, 6);

  return (
    <article
      id="omicron-article-template"
      lang="en"
      className={`omicron-article mx-auto w-full bg-white text-[#0b1f33] ${
        wide ? "max-w-[960px]" : "max-w-[820px]"
      }`}
      style={
        {
          fontFamily: "Georgia, 'Times New Roman', serif",
          "--j-primary": palette.primary,
          "--j-link": palette.link,
          "--j-soft-link": palette.softLink,
          "--j-soft": palette.soft,
          "--j-wordmark": palette.wordmark,
          "--j-cite": palette.cite,
          "--j-oa": palette.openAccess,
        } as CSSProperties
      }
    >
      {/* System-generated cover — no upload needed */}
      <ArticleCoverPage
        journalTitle={journalTitle}
        journalShortTitle={journalShortTitle || abbr}
        coverColor={coverColor}
        journalSlug={journalSlug}
        issn={issn}
        eIssn={eIssn}
        articleTitle={title}
        authors={authors.map(authorDisplayName).filter(Boolean)}
        articleType={typeShown}
        volume={volume}
        issue={issue}
        year={year}
        openAccess={openAccess}
        logoUrl={logoUrl}
        coverImageUrl={logoUrl}
      />

      <table className="omicron-print-frame">
        <tbody>
          <tr>
            <td>
      <header className="omicron-template-masthead box-border w-full max-w-full overflow-hidden px-6 pt-5 sm:px-8">
        {/* Abbr mark (left) · journal title (center) · Omicron logo (right) */}
        <div className="omicron-template-brandrow grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
          <JournalAbbrMark
            abbr={abbr}
            color={palette.primary}
            soft={palette.soft}
            size="md"
            label={journalShortTitle || journalTitle || "Journal"}
          />

          <div className="min-w-0 text-center">
            <p
              className="omicron-template-journal-title text-[11px] font-bold uppercase leading-snug tracking-[0.04em] sm:text-[12.5px] sm:tracking-[0.055em]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "var(--j-primary)",
              }}
            >
              {journalTitle || journalShortTitle || "Omicron Journal"}
            </p>
            <a
              href={jUrl}
              className="mt-1 inline-block text-[10px] font-medium hover:underline sm:text-[11px]"
              style={{ color: "var(--j-link)" }}
            >
              {journalPathLabel}
            </a>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-omicron.png"
              alt="Omicron Publications"
              className="h-9 w-auto max-w-[118px] object-contain object-right sm:h-10 sm:max-w-[132px]"
            />
            {openAccess ? (
              <span
                className="inline-block rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
                style={{ background: "var(--j-oa)" }}
              >
                Open Access
              </span>
            ) : null}
          </div>
        </div>

        {/* Layout-editor metadata strip */}
        <div className="omicron-template-meta mt-3.5 grid grid-cols-1 gap-1 border border-[#d8dee6] bg-[#f3f5f8] px-2.5 py-1.5 text-[9.5px] leading-snug text-[#3a4a5c] sm:grid-cols-3 sm:items-center sm:gap-2 sm:text-[10px]">
          <p className="min-w-0 sm:text-left">
            {eIssn ? (
              <>
                <span className="font-semibold text-[#0b1f33]">e-ISSN:</span>{" "}
                {eIssn}
              </>
            ) : issn ? (
              <>
                <span className="font-semibold text-[#0b1f33]">ISSN:</span>{" "}
                {issn}
              </>
            ) : (
              <span className="font-semibold text-[#0b1f33]">
                Publisher: Omicron Publications
              </span>
            )}
            {(eIssn || issn) && (
              <span className="mt-0.5 block text-[#5b6b7c]">
                Publisher: Omicron Publications
              </span>
            )}
          </p>
          <p className="min-w-0 text-left sm:text-center">
            {editable ? (
              <>
                Vol.{" "}
                <TemplateEditable
                  as="span"
                  value={volume || ""}
                  onChange={(volume) => patch({ volume })}
                  placeholder="X"
                  className="inline-block min-w-[1.25rem] text-center font-semibold text-[#0b1f33]"
                  showFocusRing={false}
                />
                , No.{" "}
                <TemplateEditable
                  as="span"
                  value={issue || ""}
                  onChange={(issue) => patch({ issue })}
                  placeholder="X"
                  className="inline-block min-w-[1.25rem] text-center font-semibold text-[#0b1f33]"
                  showFocusRing={false}
                />
                ,{" "}
                <TemplateEditable
                  as="span"
                  value={pages || ""}
                  onChange={(pages) => patch({ pages })}
                  placeholder="XXX-XXX"
                  className="inline-block min-w-[3rem] text-center font-semibold text-[#0b1f33]"
                  showFocusRing={false}
                />
                , {year}
              </>
            ) : (
              <>
                {volume ? `Vol. ${volume}` : "Vol. —"}
                {issue ? `, No. ${issue}` : ""}
                {pages ? `, ${pages}` : ", XXX-XXX"}
                {`, ${year}`}
              </>
            )}
          </p>
          <p className="min-w-0 break-all sm:text-right">
            <span className="font-semibold text-[#0b1f33]">DOI:</span>{" "}
            {editable ? (
              <TemplateEditable
                as="span"
                value={doi || ""}
                onChange={(doi) => patch({ doi })}
                placeholder="10.58000/…"
                className="inline-block min-w-[7rem]"
                showFocusRing={false}
              />
            ) : (
              <a
                href={doiHref}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                style={{ color: "var(--j-link)" }}
              >
                {doi || "Pending"}
              </a>
            )}
          </p>
        </div>

        {/* Article type between hairlines */}
        <div className="omicron-template-type mt-4 flex items-center gap-3">
          <span
            className="h-px min-w-0 flex-1"
            style={{ background: "var(--j-primary)" }}
            aria-hidden
          />
          <span
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0b1f33] sm:text-[12px]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {editable ? (
              <TemplateEditable
                as="span"
                value={typeShown}
                onChange={(articleType) => patch({ articleType })}
                placeholder="Research Article"
                className="inline-block min-w-[8rem] text-center uppercase tracking-[0.14em]"
                showFocusRing={false}
              />
            ) : (
              typeShown
            )}
          </span>
          <span
            className="h-px min-w-0 flex-1"
            style={{ background: "var(--j-primary)" }}
            aria-hidden
          />
        </div>
      </header>

      <div className="omicron-article-inner box-border w-full max-w-full overflow-hidden px-6 pb-8 pt-4 sm:px-8">
        <div
          className={`omicron-article-front ${editable ? "omicron-article-front-editable" : ""}`}
        >
        {editable ? (
          <TemplateEditable
            as="h1"
            value={title}
            onChange={(next) => patch({ title: next })}
            placeholder="Article title — click to type"
            className="omicron-template-article-title text-[1.35rem] font-bold leading-[1.28] tracking-tight sm:text-[1.55rem]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "var(--j-link)",
            }}
          />
        ) : (
          <h1
            className="omicron-template-article-title text-[1.35rem] font-bold leading-[1.28] tracking-tight sm:text-[1.55rem]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "var(--j-link)",
            }}
          >
            {title || "Article title"}
          </h1>
        )}

        {editable ? (
          <TemplateEditable
            as="p"
            value={authorsPlain}
            onChange={(authorsText) => patch({ authorsText })}
            placeholder="Author names, comma-separated — click to type"
            className="mt-3.5 text-[13.5px] font-semibold leading-relaxed text-[#0b1f33]"
          />
        ) : (
          <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#0b1f33]">
            <AuthorOrcidLine
              authors={authors}
              affiliations={affiliations}
              correspondingColor={palette.link}
            />
          </p>
        )}

        {editable ? (
          <TemplateEditable
            as="div"
            multiline
            value={affiliationsText}
            onChange={(affiliationsText) => patch({ affiliationsText })}
            placeholder="Affiliations — one per line"
            className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-[#5b6b7c]"
          />
        ) : (
          affiliations.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-[#5b6b7c]">
              {affiliations.map((aff, i) => (
                <li key={`${aff}-${i}`}>
                  <sup className="mr-1" style={{ color: "var(--j-link)" }}>
                    {i + 1}
                  </sup>
                  {aff}
                </li>
              ))}
            </ul>
          )
        )}

        {/* SAUCIS-style two-column: sidebar history + abstract */}
        <div className="omicron-template-abstract-grid mt-5">
          <aside className="omicron-template-sidebar">
            <div className="omicron-template-sidebar-block">
              <p className="omicron-template-sidebar-label">Corresponding author</p>
              {editable ? (
                <TemplateEditable
                  as="p"
                  value={corrEmail}
                  onChange={(correspondingEmail) =>
                    patch({ correspondingEmail })
                  }
                  placeholder="author@institution.edu"
                  className="mt-1 break-all text-[11px] leading-snug"
                  style={{ color: "var(--j-link)" }}
                  showFocusRing={false}
                />
              ) : (
                <p
                  className="mt-1 break-all text-[11px] leading-snug"
                  style={{ color: "var(--j-link)" }}
                >
                  {corrEmail || "—"}
                </p>
              )}
            </div>

            <div className="omicron-template-sidebar-block">
              <p className="omicron-template-sidebar-label">Article History</p>
              <dl className="mt-1.5 space-y-1 text-[10.5px] leading-snug text-[#5b6b7c]">
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-[#0b1f33]">Received:</dt>
                  <dd>{receivedAt || "—"}</dd>
                </div>
                {revisedAt ? (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-[#0b1f33]">Revised:</dt>
                    <dd>{revisedAt}</dd>
                  </div>
                ) : null}
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-[#0b1f33]">Accepted:</dt>
                  <dd>{acceptedAt || "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-[#0b1f33]">Published:</dt>
                  <dd>{publishedAt || "—"}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[9.5px] text-[#8a97a6]">{manuscriptId}</p>
            </div>

            <div
              className="omicron-template-sidebar-mark"
              style={{ color: "var(--j-soft-link)" }}
              aria-hidden
            >
              {abbr}
            </div>
          </aside>

          <section className="omicron-article-abstract omicron-template-abstract-main">
            <h2
              className="omicron-template-section-label text-[13px] font-bold tracking-tight"
              style={{
                color: "var(--j-primary)",
                fontFamily: "Helvetica, Arial, sans-serif",
              }}
            >
              Abstract
            </h2>
            {editable ? (
              <TemplateEditable
                mode="html"
                value={abstract}
                onChange={(next) => patch({ abstract: next })}
                placeholder="Abstract — click here and type"
                className="omicron-abstract-html min-h-[4.5rem] text-[12.5px] leading-relaxed"
              />
            ) : (
              <AbstractHtml abstract={abstract} />
            )}
            {editable || keywords.length > 0 ? (
              <section
                className="omicron-keywords"
                style={{ background: "var(--j-soft)" }}
              >
                <span
                  className="text-[11px] font-bold tracking-tight"
                  style={{
                    color: "var(--j-primary)",
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}
                >
                  Keywords
                </span>
                {editable ? (
                  <TemplateEditable
                    as="span"
                    value={keywordsText}
                    onChange={(keywordsText) => patch({ keywordsText })}
                    placeholder="First keyword, Second keyword"
                    className="ml-2 inline-block min-w-[12rem] text-[12px] text-[#0b1f33]"
                    showFocusRing={false}
                  />
                ) : (
                  <span className="ml-2 text-[12px] text-[#0b1f33]">
                    {keywords.join(", ")}
                  </span>
                )}
              </section>
            ) : null}
          </section>
        </div>
        </div>

        <div className="omicron-article-flow">
        {editable ? (
          <TemplateEditable
            mode="html"
            value={body || ""}
            onChange={(next) => patch({ body: next })}
            placeholder="Click here to place the cursor and type the article body — sections, equations, tables, and figures…"
            showFocusRing={false}
            className="omicron-article-body manuscript-wysiwyg omicron-body-inplace"
          />
        ) : bodySlot != null ? (
          bodySlot
        ) : body?.trim() ? (
          <ArticleBodyHtml body={body} />
        ) : null}

        {/* Article Information Form — SAUCIS end matter */}
        <section className="omicron-article-info omicron-span-all">
          <h2
            className="omicron-template-section-label text-[13px] font-bold tracking-tight"
            style={{
              color: "var(--j-primary)",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Article Information Form
          </h2>

          <div className="omicron-article-info-block">
            <p className="omicron-article-info-label">Author&apos;s Contributions</p>
            <p>
              {authors.length <= 1
                ? "The article is a single-author work. The author prepared the manuscript independently."
                : "All authors contributed to the conception, analysis, and writing of this manuscript."}
            </p>
          </div>

          {(editable || fundingText) && (
            <div className="omicron-article-info-block">
              <p className="omicron-article-info-label">Acknowledgments / Support</p>
              {editable ? (
                <TemplateEditable
                  as="p"
                  multiline
                  value={fundingText}
                  onChange={(funding) => patch({ funding })}
                  placeholder="Acknowledgments, grants, and institutional support…"
                  className="mt-1 text-[12.5px] leading-relaxed text-[#1a3a5a]"
                  showFocusRing={false}
                />
              ) : (
                <p>{reflowArticleText(fundingText)}</p>
              )}
            </div>
          )}

          <div className="omicron-article-info-block">
            <p className="omicron-article-info-label">Conflict of Interest</p>
            {editable ? (
              <TemplateEditable
                as="p"
                multiline
                value={
                  coiText ||
                  "The authors declare that there is no conflict of interest regarding the publication of this paper."
                }
                onChange={(conflictOfInterest) =>
                  patch({ conflictOfInterest })
                }
                placeholder="Conflict of interest statement…"
                className="mt-1 text-[12.5px] leading-relaxed text-[#1a3a5a]"
                showFocusRing={false}
              />
            ) : (
              <p>
                {reflowArticleText(
                  coiText ||
                    "The authors declare that there is no conflict of interest regarding the publication of this paper.",
                )}
              </p>
            )}
          </div>

          <div className="omicron-article-info-block">
            <p className="omicron-article-info-label">Ethical Approval</p>
            <p>
              It is declared that during the preparation of this study, scientific
              and ethical principles were followed, and all studies used are listed
              in the bibliography.
            </p>
          </div>

          <div className="omicron-article-info-block">
            <p className="omicron-article-info-label">License</p>
            <p>
              This article is licensed under{" "}
              <a
                href={licenseHref}
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline"
                style={{ color: "var(--j-link)" }}
              >
                {licenseLabel}
              </a>
              .
            </p>
          </div>
        </section>

        <section className="omicron-end-matter omicron-cite-as omicron-span-all">
          <p className="text-[12px] leading-relaxed text-[#1a3a5a]">
            <span
              className="font-bold"
              style={{ color: "var(--j-primary)" }}
            >
              Cite as:{" "}
            </span>
            {apa}
            {articleUrl ? (
              <>
                {" "}
                <a
                  href={articleUrl}
                  className="hover:underline"
                  style={{ color: "var(--j-link)" }}
                >
                  {articleUrl}
                </a>
              </>
            ) : null}
          </p>
        </section>
        </div>
      </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
      <RunningFooter
        year={year}
        doiHref={doiHref}
        doiLabel={doiLabel}
        journalTitle={journalTitle}
        journalShortTitle={journalShortTitle}
        citeBits={citeBits}
      />
            </td>
          </tr>
        </tfoot>
      </table>
    </article>
  );
}
