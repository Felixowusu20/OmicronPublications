"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articlesPathForField, RESEARCH_FIELDS } from "@/lib/research-fields";

export type ResearchSpotlightCard = {
  id: string;
  title: string;
  summary?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  articleTitle?: string | null;
  href?: string | null;
  ctaLabel?: string | null;
};

const FALLBACK_FIELDS = RESEARCH_FIELDS.slice(0, 6).map((f) => ({
  id: f.id,
  title: f.label,
  summary: f.summary,
}));

/**
 * Interactive field index — select a discipline to preview it.
 */
export function ResearchSpotlights({
  initialItems = [],
}: {
  initialItems?: ResearchSpotlightCard[];
}) {
  const [items, setItems] = useState<ResearchSpotlightCard[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems.length > 0) return;
    void fetch("/api/cms/research-spotlights")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.spotlights ?? []);
      })
      .catch(() => {
        setItems([]);
      });
  }, [initialItems.length]);

  const fields: ResearchSpotlightCard[] = useMemo(
    () =>
      items.length > 0
        ? items
        : FALLBACK_FIELDS.map((f) => ({
            id: f.id,
            title: f.title,
            summary: f.summary,
            href: articlesPathForField(f.id),
            ctaLabel: "Browse field articles",
          })),
    [items],
  );

  const active =
    fields.find((f) => f.id === (activeId ?? fields[0]?.id)) ?? fields[0];

  if (!active) return null;

  return (
    <section
      className="border-b border-[var(--line)] bg-[var(--paper)]"
      aria-label="Research disciplines"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="max-w-2xl border-b border-[var(--line)] pb-6">
          <h2 className="acs-section-title">What we publish</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-[var(--muted)]">
            Fields are bound to journals. When an author submits to a journal
            and the paper is published, it appears under the matching
            Chemistry, Biology, and related fields.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:items-stretch">
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {fields.map((field, index) => {
              const selected = field.id === active.id;
              return (
                <li key={field.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveId(field.id)}
                    onFocus={() => setActiveId(field.id)}
                    onClick={() => setActiveId(field.id)}
                    className={`flex w-full items-center gap-4 py-4 text-left transition sm:py-5 ${
                      selected
                        ? "text-[var(--accent)]"
                        : "text-[var(--ink)] hover:text-[var(--accent)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`w-8 shrink-0 text-xs font-semibold tracking-[0.12em] ${
                        selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-lg font-semibold sm:text-xl">
                      {field.title}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full transition ${
                        selected
                          ? "bg-[var(--accent)]"
                          : "bg-transparent ring-1 ring-[var(--line)]"
                      }`}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            key={active.id}
            className="flex flex-col overflow-hidden border border-[var(--line)] bg-[var(--surface)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--ink)] sm:aspect-[16/9]">
              {active.imageUrl ? (
                <Image
                  src={active.imageUrl}
                  alt={active.articleTitle || active.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  unoptimized
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(145deg, #1a3a5a 0%, #243f5c 45%, #c84e27 120%)",
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/70 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 font-[family-name:var(--font-display)] text-2xl text-white sm:bottom-5 sm:left-5 sm:text-3xl">
                {active.title}
              </p>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-7">
              {active.summary ? (
                <p className="text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                  {active.summary}
                </p>
              ) : null}
              {active.articleTitle ? (
                <p className="mt-4 text-sm font-medium text-[var(--ink)]">
                  Featured: {active.articleTitle}
                </p>
              ) : null}
              <div className="mt-auto pt-6">
                <Link
                  href={active.href || "/journals"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {active.ctaLabel || "Browse journals"}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
