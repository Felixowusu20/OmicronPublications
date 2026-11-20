import { prisma, withDbRetry } from "@/lib/db";
import { jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const journals = await withDbRetry(() =>
      prisma.journal.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      }),
    );
    return jsonOk({ journals });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/journals] unavailable:", message.split("\n")[0]);
    return jsonOk({ journals: [] });
  }
}
