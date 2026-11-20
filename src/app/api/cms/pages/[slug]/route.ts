import { prisma, withDbRetry } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { ensureCmsDefaults, isCmsPageSlug } from "@/lib/cms";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  if (!isCmsPageSlug(slug)) {
    return jsonError("Unknown page", 404);
  }

  try {
    const page = await withDbRetry(async () => {
      await ensureCmsDefaults();
      return prisma.cmsPage.findFirst({
        where: { slug, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });
    });
    if (!page) return jsonError("Page not found", 404);
    return jsonOk({ page });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/pages] unavailable:", message.split("\n")[0]);
    return jsonError("Could not load page", 500);
  }
}
