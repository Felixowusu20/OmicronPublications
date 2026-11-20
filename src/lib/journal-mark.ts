/** Optional uploaded / bundled journal mark images keyed by short title. */
const MARK_BY_SHORT: Record<string, string> = {
  OJHBR: "/brand/mark-ojhbr.png",
};

/**
 * Resolve a journal brand mark image. Prefers an explicit cover/logo upload,
 * then a known bundled mark (e.g. OJHBR), otherwise null (CSS abbr mark).
 */
export function resolveJournalMarkUrl(args: {
  shortTitle?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
}): string | null {
  const uploaded = (args.coverImageUrl || args.logoUrl || "").trim();
  if (uploaded) return uploaded;
  const key = (args.shortTitle || "").trim().toUpperCase();
  if (key && MARK_BY_SHORT[key]) return MARK_BY_SHORT[key];
  return null;
}
