"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * ACS-style centered hero search: white field, rust border, magnifying-glass submit.
 */
function HeroSearchForm() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&type=articles`);
    } else {
      router.push("/search");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={onSubmit}
        role="search"
        className="flex overflow-hidden rounded-sm border-[3px] border-[var(--accent)] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
      >
        <label className="sr-only" htmlFor="hero-search">
          Search articles, journals, and authors
        </label>
        <input
          id="hero-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles, journals, authors…"
          className="min-w-0 flex-1 bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] sm:px-5 sm:text-base"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center bg-[var(--accent)] px-4 text-white transition hover:bg-[#a83f1f] sm:px-5"
          aria-label="Search"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
        </button>
      </form>
      <p className="mt-3 text-center">
        <Link
          href="/search"
          className="text-sm font-medium text-white underline decoration-white/70 underline-offset-4 transition hover:decoration-white"
        >
          Advanced Search
        </Link>
      </p>
    </div>
  );
}

export function HeroSearch() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto h-[52px] w-full max-w-2xl rounded-sm bg-white/90" />
      }
    >
      <HeroSearchForm />
    </Suspense>
  );
}
