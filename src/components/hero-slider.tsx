"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HeroSearch } from "@/components/hero-search";

type Slide = {
  src: string;
  alt: string;
  title?: string;
  body?: string;
};

const FALLBACK_SLIDES: Slide[] = [
  {
    src: "/hero/research-fields.jpg",
    alt: "Laboratory research across chemistry, biology, and physics",
    title: "Power your research and learning",
    body: "Explore trusted, peer-reviewed research across chemistry, biology, physics, and related fields.",
  },
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
];

const SLIDE_MS = 6500;

const COPY = {
  title: "Power your research and learning",
  subtitle:
    "Explore trusted, peer-reviewed research across chemistry, biology, physics, and related fields.",
};

/**
 * Omicron ACS-style hero: centered brand + search over a full-bleed
 * background carousel (not the PSI split left-panel / right-image layout).
 */
export function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/cms/hero")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const next: Slide[] = (data.slides ?? [])
          .map(
            (s: {
              imageUrl?: string | null;
              alt?: string | null;
              title?: string | null;
              body?: string | null;
            }) => ({
              src: (s.imageUrl || "").trim(),
              alt: (s.alt || s.title || "Featured research").trim(),
              title: (s.title || "").trim() || undefined,
              body: (s.body || "").trim() || undefined,
            }),
          )
          .filter((s: Slide) => Boolean(s.src));
        if (next.length > 0) setSlides(next);
      })
      .catch(() => {
        /* keep local fallbacks */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = slides[index] ?? slides[0];
  const headline =
    current?.title &&
    current.title.length <= 72 &&
    !current.title.toLowerCase().includes("chemistry, biology")
      ? current.title
      : COPY.title;
  const supporting =
    current?.title && headline === current.title
      ? current.body || COPY.subtitle
      : current?.body && current.body.length < 180
        ? current.body
        : COPY.subtitle;

  return (
    <section
      className="relative isolate max-w-[100%] overflow-x-clip bg-[var(--brand-navy)] text-white"
      aria-label="Featured research"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden={!ready}>
        {slides.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-[1400ms] ease-in-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              unoptimized={slide.src.startsWith("http")}
              className={`object-cover object-[center_32%] sm:object-center ${
                i === index ? "hero-kenburns scale-105" : "scale-105"
              }`}
            />
          </div>
        ))}

        {/* Omicron navy → rust wash — distinct from PSI wine panel */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(165deg, rgba(26,58,90,0.78) 0%, rgba(26,58,90,0.62) 42%, rgba(200,78,39,0.38) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-[1] opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 18% 12%, rgba(255,255,255,0.14) 0%, transparent 42%), radial-gradient(ellipse at 88% 78%, rgba(200,78,39,0.28) 0%, transparent 48%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-[var(--brand-navy)]/55 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[52vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[62vh] sm:px-6 sm:py-20">
        <p className="font-brand text-[2.7rem] leading-none tracking-tight text-white sm:text-5xl md:text-[3.45rem]">
          omicron
        </p>
        <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.36em] text-white/85 sm:text-sm">
          Publications
        </p>

        <div
          className="mt-5 h-[3px] w-14 rounded-full bg-[var(--accent)] sm:mt-6"
          aria-hidden
        />

        <h1 className="mt-7 max-w-3xl font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-tight tracking-tight text-white sm:mt-8 sm:text-4xl md:text-[2.55rem]">
          {headline}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-body)] text-base leading-relaxed text-white/92 sm:text-lg md:text-xl">
          {supporting}
        </p>

        <div className="mt-9 w-full sm:mt-11">
          <HeroSearch />
        </div>

        {slides.length > 1 ? (
          <div
            className="mt-10 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Hero background slides"
          >
            {slides.map((slide, i) => (
              <button
                key={`${slide.src}-dot-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show background ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/65"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
