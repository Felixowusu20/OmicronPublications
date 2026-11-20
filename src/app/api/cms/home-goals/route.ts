import { prisma, withDbRetry } from "@/lib/db";
import { jsonOk } from "@/lib/api";
import { parseGoalTabLinks } from "@/lib/home-cms-defaults";

export async function GET() {
  try {
    const [tabs, section] = await withDbRetry(() =>
      Promise.all([
        prisma.homeGoalTab.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        }),
        prisma.homeSection.findUnique({ where: { key: "goals" } }),
      ]),
    );
    return jsonOk({
      section,
      tabs: tabs.map((tab) => ({
        ...tab,
        links: parseGoalTabLinks(tab.links),
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/home-goals] unavailable:", message.split("\n")[0]);
    return jsonOk({ tabs: [], section: null });
  }
}
