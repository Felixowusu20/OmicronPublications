import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
  prismaSchemaVersion?: number;
};

/** Bump when schema fields change so a stale HMR client is discarded. */
const PRISMA_SCHEMA_VERSION = 8;

function isTransientDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  if (
    code === "P1001" ||
    /timeout|terminated|ECONNRESET|ECONNREFUSED|EPIPE|Can't reach database|DatabaseNotReachable|Connection terminated|too many clients|Client has encountered a connection error|Connection ended unexpectedly|Neon|server closed the connection/i.test(
      message,
    )
  ) {
    return true;
  }
  const cause =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: unknown }).cause
      : undefined;
  if (cause && cause !== err) return isTransientDbError(cause);
  return false;
}

/**
 * Retry when Neon / the pooler drops an idle connection or the compute is
 * cold-starting (common P1001 / DatabaseNotReachable).
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; delayMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 4;
  const delayMs = opts?.delayMs ?? 900;
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransientDbError(err) || attempt === retries) throw err;
      // Exponential-ish backoff so Neon has time to wake.
      await new Promise((r) =>
        setTimeout(r, delayMs * Math.min(attempt + 1, 4)),
      );
    }
  }
  throw last;
}

/**
 * pg v9 will treat sslmode=require as weaker than today's alias-to-verify-full.
 * Pin verify-full so Neon keeps the current secure behavior without the warning.
 */
function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const mode = (parsed.searchParams.get("sslmode") || "").toLowerCase();
    if (
      !mode ||
      mode === "prefer" ||
      mode === "require" ||
      mode === "verify-ca"
    ) {
      parsed.searchParams.set("sslmode", "verify-full");
    }
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch {
    return url
      .replace(/([?&])sslmode=(prefer|require|verify-ca)\b/i, "$1sslmode=verify-full")
      .replace(/([?&])uselibpqcompat=[^&]*&?/i, "$1")
      .replace(/[?&]$/, "");
  }
}

function createPool(connectionString: string) {
  // Keep the client pool small: Neon already pools via the `-pooler` host.
  // Longer connect timeout helps when the Neon compute is waking from sleep.
  const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(connectionString),
    max: 3,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 8_000,
    allowExitOnIdle: true,
    keepAlive: true,
  });
  pool.on("error", (err) => {
    console.error("[pg pool] idle client error:", err.message);
  });
  return pool;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    globalForPrisma.pgPool &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION
      ? globalForPrisma.pgPool
      : createPool(connectionString);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool, {
    onPoolError: (err) => {
      console.error("[prisma pg] pool error:", err.message);
    },
  });

  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 20_000,
      timeout: 45_000,
    },
  });
}

/** Human-readable message for common Prisma / pooler failures. */
export function prismaFailureMessage(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : String(err);
  if (/timeout|terminated|ECONNRESET|Can't reach database/i.test(message)) {
    return "Database connection timed out. Please try again in a moment.";
  }
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  if (code === "P2002") {
    return "A record with this slug or NID already exists.";
  }
  if (code === "P2028" || code === "P2024") {
    return "Database transaction timed out. Please try again.";
  }
  return fallback;
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION
) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  void globalForPrisma.pgPool?.end().catch(() => undefined);
  globalForPrisma.prisma = undefined;
  globalForPrisma.pgPool = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
