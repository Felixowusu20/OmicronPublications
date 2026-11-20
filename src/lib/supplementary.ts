/**
 * Helpers for article-bound supplementary materials.
 * Figures/tables marked `.omicron-supplementary` in the production body can
 * seed the dedicated supplementary page for that same article slug.
 */

const SUPPLEMENTARY_NODE =
  /<(figure|div|section|aside)\b[^>]*\bomicron-supplementary\b[^>]*>[\s\S]*?<\/\1>/gi;

export function extractSupplementaryFromBody(body: string | null | undefined): string {
  if (!body?.trim()) return "";
  const parts: string[] = [];
  for (const match of body.matchAll(SUPPLEMENTARY_NODE)) {
    const chunk = match[0]?.trim();
    if (chunk) parts.push(chunk);
  }
  return parts.join("\n");
}

/** Prefer explicit supplementary HTML; otherwise pull marked nodes from the body. */
export function resolveSupplementaryHtml(opts: {
  supplementary?: string | null;
  body?: string | null;
}): string {
  const explicit = opts.supplementary?.trim() ?? "";
  if (explicit) return explicit;
  return extractSupplementaryFromBody(opts.body);
}

export function hasSupplementaryContent(opts: {
  html?: string | null;
  url?: string | null;
}): boolean {
  return Boolean(opts.html?.trim() || opts.url?.trim());
}
