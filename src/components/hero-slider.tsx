"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroSearch } from "@/components/hero-search";
import { RESEARCH_FIELDS } from "@/lib/research-fields";

const HERO_SLIDES = [
  {
    src: "/hero/slide-1.jpg",
    alt: "Scientific research across chemistry, biology, physics, and related fields",
  },
  {
    src: "/hero/slide-2.jpg",
    alt: "Researchers collaborating in the laboratory",
  },
  {
    src: "/hero/slide-3.jpg",
    alt: "Open scholarship and peer-reviewed discovery",
  },
  {
    src: "/hero/slide-4.jpg",
    alt: "Global research and scientific publishing",
  },
] as const;

const SLIDE_MS = 5500;

/**
 * Split hero: static left editorial panel + automatic right-image slide only.
 * No arrows, dots, or controls — left copy never changes with the slideshow.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className="relative isolate max-w-[100%] overflow-x-clip bg-[var(--brand-navy)] text-white"
      aria-label="Featured research"
    >
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 lg:min-h-[30rem] lg:px-10 lg:py-20">
          <p className="font-brand text-[2.2rem] leading-none tracking-tight text-white sm:text-[2.6rem]">
            omicron
          </p>
          <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/80">
            Publications
          </p>

          <h1 className="mt-7 max-w-xl font-[family-name:var(--font-display)] text-[1.55rem] font-bold leading-tight tracking-tight text-white sm:text-[1.85rem] lg:text-[2.05rem]">
            Peer-reviewed research across chemistry, biology, physics, and
            related fields
          </h1>
          <p className="mt-4 max-w-lg font-[family-name:var(--font-body)] text-[0.98rem] leading-relaxed text-white/88 sm:text-base">
            Explore trusted journals, submit manuscripts, and follow peer review
            through to open, citable publication.
          </p>

          <ul
            className="mt-6 flex max-w-xl flex-wrap gap-x-3.5 gap-y-1.5 border-t border-white/20 pt-4"
            aria-label="Research fields we publish"
          >
            {RESEARCH_FIELDS.slice(0, 8).map((field) => (
              <li
                key={field.id}
                className="text-[0.82rem] font-semibold text-white/88"
              >
                {field.label}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/submissions/new"
              className="inline-flex rounded-sm bg-white px-5 py-2.5 text-[0.9rem] font-bold text-[var(--brand-navy)] transition hover:bg-[var(--accent-soft)]"
            >
              Submit a manuscript
            </Link>
            <Link
              href="/journals"
              className="inline-flex rounded-sm border border-white/40 px-5 py-2.5 text-[0.9rem] font-bold text-white transition hover:bg-white/10"
            >
              Browse journals
            </Link>
          </div>

          <div className="mt-8 w-full max-w-lg">
            <HeroSearch />
          </div>
        </div>

        <div
          className="relative min-h-[14rem] overflow-hidden sm:min-h-[20rem] lg:min-h-full"
          aria-live="polite"
          aria-atomic="true"
        >
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.src}
                alt={i === index ? slide.alt : ""}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          ))}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--brand-navy)]/35 via-transparent to-transparent lg:from-[var(--brand-navy)]/25"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
