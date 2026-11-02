import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedHomepageCms } from "../src/lib/home-cms-seed";

async function main() {
  await seedHomepageCms();

  const [
    heroSlides,
    homeSections,
    homeGoalTabs,
    indexedPlatforms,
    researchSpotlights,
    announcements,
  ] = await Promise.all([
    prisma.heroSlide.count(),
    prisma.homeSection.count(),
    prisma.homeGoalTab.count(),
    prisma.indexedPlatform.count(),
    prisma.researchSpotlight.count(),
    prisma.announcement.count(),
  ]);

  console.log("Homepage CMS seed complete:");
  console.log(`  heroSlides: ${heroSlides}`);
  console.log(`  homeSections: ${homeSections}`);
  console.log(`  homeGoalTabs: ${homeGoalTabs}`);
  console.log(`  indexedPlatforms: ${indexedPlatforms}`);
  console.log(`  researchSpotlights: ${researchSpotlights}`);
  console.log(`  announcements: ${announcements}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
