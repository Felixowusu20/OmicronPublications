import { prisma } from "@/lib/db";
import {
  DEFAULT_GOAL_TABS,
  DEFAULT_GOALS_SECTION,
  DEFAULT_INDEXED_PLATFORMS,
  DEFAULT_INDEXED_SECTION,
} from "@/lib/home-cms-defaults";

const DEFAULT_HERO_SLIDES = [
  {
    title: "Chemistry, biology, physics, and the research that moves them forward",
    body: "Peer-reviewed open-access journals for the sciences.",
    imageUrl: "/hero/research-fields.jpg",
    alt: "Laboratory research across chemistry, biology, and physics",
    ctaLabel: "Submit a manuscript",
    ctaHref: "/submissions/new",
    sortOrder: 0,
  },
] as const;

const DEFAULT_RESEARCH_SPOTLIGHTS = [
  {
    title: "Chemistry",
    summary:
      "Synthesis, materials, and analytical methods that support experimental discovery.",
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 0,
  },
  {
    title: "Biology",
    summary:
      "Cellular systems, molecular life sciences, and organism-level research.",
    imageUrl:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 1,
  },
  {
    title: "Physics",
    summary:
      "Theory and experiment spanning condensed matter, optics, and applied physics.",
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 2,
  },
  {
    title: "Medicine",
    summary:
      "Biomedical findings and clinical research that strengthen patient-facing science.",
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 3,
  },
  {
    title: "Engineering",
    summary:
      "Applied design, systems, and technology research across engineering fields.",
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 4,
  },
  {
    title: "Earth science",
    summary:
      "Climate, geoscience, and environmental studies grounded in rigorous evidence.",
    imageUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=80",
    externalHref: "/journals",
    ctaLabel: "Browse journals",
    sortOrder: 5,
  },
] as const;

const DEFAULT_ANNOUNCEMENTS = [
  {
    title: "Welcome to Omicron Publications",
    summary:
      "Our open-access journals are open for submissions across chemistry, biology, physics, and related fields.",
    href: "/submissions/new",
    imageUrl:
      "https://images.unsplash.com/photo-1507413245164-6160d80946b4?auto=format&fit=crop&w=1200&q=80",
    publishedAt: new Date(),
  },
  {
    title: "Author guidelines are live",
    summary:
      "Review article types, formatting expectations, and the peer-review pathway before you submit.",
    href: "/authors/guidelines",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    publishedAt: new Date(Date.now() - 86400000 * 2),
  },
] as const;

/** Seed Get started tabs + section heading when the table is empty. */
export async function ensureHomeGoalTabsSeeded() {
  const count = await prisma.homeGoalTab.count();
  if (count > 0) return;

  await prisma.$transaction([
    prisma.homeSection.upsert({
      where: { key: DEFAULT_GOALS_SECTION.key },
      create: {
        key: DEFAULT_GOALS_SECTION.key,
        eyebrow: DEFAULT_GOALS_SECTION.eyebrow,
        title: DEFAULT_GOALS_SECTION.title,
        body: DEFAULT_GOALS_SECTION.body,
      },
      update: {},
    }),
    ...DEFAULT_GOAL_TABS.map((tab) =>
      prisma.homeGoalTab.create({
        data: {
          key: tab.key,
          label: tab.label,
          title: tab.title,
          body: tab.body,
          story: tab.story,
          imageUrl: tab.imageUrl,
          imageAlt: tab.imageAlt,
          imageCaption: tab.imageCaption,
          links: tab.links,
          sortOrder: tab.sortOrder,
          isActive: true,
        },
      }),
    ),
  ]);
}

/** Seed Indexed platforms + section heading when the table is empty. */
export async function ensureIndexedPlatformsSeeded() {
  const count = await prisma.indexedPlatform.count();
  if (count > 0) return;

  await prisma.$transaction([
    prisma.homeSection.upsert({
      where: { key: DEFAULT_INDEXED_SECTION.key },
      create: {
        key: DEFAULT_INDEXED_SECTION.key,
        eyebrow: DEFAULT_INDEXED_SECTION.eyebrow,
        title: DEFAULT_INDEXED_SECTION.title,
        body: DEFAULT_INDEXED_SECTION.body || null,
      },
      update: {},
    }),
    ...DEFAULT_INDEXED_PLATFORMS.map((platform) =>
      prisma.indexedPlatform.create({
        data: {
          name: platform.name,
          blurb: platform.blurb,
          href: platform.href,
          logoUrl: platform.logoUrl,
          sortOrder: platform.sortOrder,
          isActive: true,
        },
      }),
    ),
  ]);
}

/** Seed research discipline cards when empty. */
export async function ensureResearchSpotlightsSeeded() {
  const count = await prisma.researchSpotlight.count();
  if (count > 0) return;

  await prisma.researchSpotlight.createMany({
    data: DEFAULT_RESEARCH_SPOTLIGHTS.map((item) => ({
      title: item.title,
      summary: item.summary,
      imageUrl: item.imageUrl,
      externalHref: item.externalHref,
      ctaLabel: item.ctaLabel,
      sortOrder: item.sortOrder,
      isActive: true,
    })),
  });
}

/** Seed homepage hero slide(s) when empty. */
export async function ensureHeroSlidesSeeded() {
  const count = await prisma.heroSlide.count();
  if (count > 0) return;

  await prisma.heroSlide.createMany({
    data: DEFAULT_HERO_SLIDES.map((slide) => ({
      title: slide.title,
      body: slide.body,
      imageUrl: slide.imageUrl,
      alt: slide.alt,
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref,
      sortOrder: slide.sortOrder,
      isActive: true,
    })),
  });
}

/** Seed a couple of sample announcements when empty. */
export async function ensureAnnouncementsSeeded() {
  const count = await prisma.announcement.count();
  if (count > 0) return;

  await prisma.announcement.createMany({
    data: DEFAULT_ANNOUNCEMENTS.map((item) => ({
      title: item.title,
      summary: item.summary,
      href: item.href,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt,
      isActive: true,
    })),
  });
}

/** Seed all homepage CMS blocks (safe to re-run; only fills empty tables). */
export async function seedHomepageCms() {
  await ensureHeroSlidesSeeded();
  await ensureHomeGoalTabsSeeded();
  await ensureIndexedPlatformsSeeded();
  await ensureResearchSpotlightsSeeded();
  await ensureAnnouncementsSeeded();
}
