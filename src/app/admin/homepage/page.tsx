"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin-auth-provider";

type Counts = {
  hero: number;
  goals: number;
  platforms: number;
  spotlights: number;
  announcements: number;
};

const CARDS: {
  key: keyof Counts;
  title: string;
  href: string;
  hint: string;
}[] = [
  {
    key: "hero",
    title: "Hero",
    href: "/admin/hero",
    hint: "Main homepage banner image and headline",
  },
  {
    key: "goals",
    title: "Start paths",
    href: "/admin/home-goals",
    hint: "Author/reader paths with images and links",
  },
  {
    key: "spotlights",
    title: "Disciplines",
    href: "/admin/research-spotlights",
    hint: "Chemistry, biology, physics and related fields",
  },
  {
    key: "platforms",
    title: "Indexed platforms",
    href: "/admin/indexed-platforms",
    hint: "Google Scholar, ResearchGate, and logos",
  },
  {
    key: "announcements",
    title: "Announcements",
    href: "/admin/announcements",
    hint: "Homepage news items",
  },
];

export default function HomepageCmsHubPage() {
  const { user } = useAdminAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") return;
    let cancelled = false;
    void (async () => {
      try {
        const [hero, goals, platforms, spotlights, announcements] =
          await Promise.all([
            fetch("/api/admin/hero").then((r) => r.json()),
            fetch("/api/admin/home-goals").then((r) => r.json()),
            fetch("/api/admin/indexed-platforms").then((r) => r.json()),
            fetch("/api/admin/research-spotlights").then((r) => r.json()),
            fetch("/api/admin/announcements").then((r) => r.json()),
          ]);
        if (cancelled) return;
        setCounts({
          hero: Array.isArray(hero.slides) ? hero.slides.length : 0,
          goals: Array.isArray(goals.tabs) ? goals.tabs.length : 0,
          platforms: Array.isArray(platforms.platforms)
            ? platforms.platforms.length
            : 0,
          spotlights: Array.isArray(spotlights.spotlights)
            ? spotlights.spotlights.length
            : 0,
          announcements: Array.isArray(announcements.announcements)
            ? announcements.announcements.length
            : 0,
        });
      } catch {
        if (!cancelled) setError("Could not load homepage CMS counts.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (user?.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-[var(--muted)]">Super admin only.</p>;
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        Homepage CMS
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl">
        Edit what visitors see on the home page
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Seeded content is stored in the database. Open any block below to change
        copy, images, order, or visibility.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {card.title}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  {counts ? counts[card.key] : "…"}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{card.hint}</p>
              </div>
              <span className="text-sm font-semibold text-[var(--accent)]">
                Edit →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
