import { prisma, withDbRetry } from "@/lib/db";
import { jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const [platforms, section] = await withDbRetry(() =>
      Promise.all([
        prisma.indexedPlatform.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        }),
        prisma.homeSection.findUnique({ where: { key: "indexed" } }),
      ]),
    );
    return jsonOk({ platforms, section });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/indexed-platforms] unavailable:", message.split("\n")[0]);
    return jsonOk({ platforms: [], section: null });
  }
}
