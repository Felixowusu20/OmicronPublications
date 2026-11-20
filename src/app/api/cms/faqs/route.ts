import { jsonOk } from "@/lib/api";
import { listFaqs } from "@/lib/cms";
import { withDbRetry } from "@/lib/db";

export async function GET() {
  try {
    const faqs = await withDbRetry(() => listFaqs(true));
    return jsonOk({ faqs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[cms/faqs] unavailable:", message.split("\n")[0]);
    return jsonOk({ faqs: [] });
  }
}
