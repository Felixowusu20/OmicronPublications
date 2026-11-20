import { prisma, withDbRetry } from "@/lib/db";
import { jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const announcements = await withDbRetry(() =>
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { publishedAt: "desc" },
        take: 20,
      }),
    );
    return jsonOk({ announcements });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/announcements] unavailable:", message.split("\n")[0]);
    return jsonOk({ announcements: [] });
  }
}
