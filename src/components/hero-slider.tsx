import Image from "next/image";
import { HeroSearch } from "@/components/hero-search";
import { prisma } from "@/lib/db";

const FALLBACK = {
  title: "Power your research and learning",
  subtitle:
    "Explore trusted, peer-reviewed research across chemistry, biology, physics, and related fields.",
  imageUrl: "/hero/research-fields.jpg",
  alt: "Laboratory research across chemistry, biology, and physics",
};

/**
 * ACS-inspired full-bleed hero: brand, headline, supporting line, search.
 * Image/title still prefer CMS HeroSlide when seeded.
 */
export async function HeroSlider() {
  let slide = FALLBACK;
  try {
    const row = await prisma.heroSlide.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (row) {
      const cmsTitle = (row.title || "").trim();
      // Prefer ACS-style short headline; keep long CMS copy as subtitle.
      const looksLikeHeadline =
        cmsTitle.length > 0 &&
        cmsTitle.length <= 72 &&
        !cmsTitle.toLowerCase().includes("chemistry, biology");
      slide = {
        title: looksLikeHeadline ? cmsTitle : FALLBACK.title,
        subtitle: looksLikeHeadline
          ? FALLBACK.subtitle
          : cmsTitle || FALLBACK.subtitle,
        imageUrl: row.imageUrl || FALLBACK.imageUrl,
        alt: row.alt || row.title || FALLBACK.alt,
      };
    }
  } catch {
    // Use fallback when DB is unavailable.
  }

  return (
    <section className="relative isolate max-w-[100%] overflow-x-clip bg-[var(--ink)] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={slide.imageUrl}
          alt={slide.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] scale-105 hero-kenburns"
          unoptimized={slide.imageUrl.startsWith("http")}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(26,58,90,0.55) 0%, rgba(26,58,90,0.62) 45%, rgba(18,28,38,0.82) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[52vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[58vh] sm:px-6 sm:py-20">
        <p className="font-brand text-[2.6rem] leading-none tracking-tight text-white sm:text-5xl md:text-[3.4rem]">
          omicron
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.34em] text-white/85 sm:text-sm">
          Publications
        </p>

        <h1 className="mt-8 max-w-3xl text-[1.85rem] font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
          {slide.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-normal leading-relaxed text-white/92 sm:text-xl">
          {slide.subtitle}
        </p>

        <div className="mt-9 w-full sm:mt-10">
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}
