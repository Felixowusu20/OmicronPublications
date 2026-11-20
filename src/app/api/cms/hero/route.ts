import { prisma, withDbRetry } from "@/lib/db";
import { jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const slides = await withDbRetry(() =>
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    );
    return jsonOk({ slides });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/hero] unavailable:", message.split("\n")[0]);
    return jsonOk({ slides: [] });
  }
}
