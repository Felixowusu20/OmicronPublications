import { prisma } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";

/** Whether the first super-admin bootstrap form is still available. */
export async function GET() {
  try {
    const existingAdmin = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    return jsonOk({ available: existingAdmin === 0 });
  } catch (err) {
    console.error(err);
    return jsonError("Could not check admin bootstrap status.", 500);
  }
}
