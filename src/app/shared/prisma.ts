import { PrismaClient } from "@prisma/client";

const isProd = process.env.NODE_ENV === "production";

export const prisma = new PrismaClient({
  log: isProd ? ["warn", "error"] : ["warn", "error"],
  transactionOptions: {
    maxWait: 10_000,
    timeout: 15_000,
  },
});

/**
 * Retry the initial DB handshake a few times. On a VPS where Postgres lives
 * in a sibling docker container, the API process can boot before Postgres is
 * accepting connections; without a retry the API exits and (depending on the
 * supervisor) flaps.
 */
export async function warmUpPrisma(retries = 5, delayMs = 2000): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (e) {
      lastErr = e;
      console.error(
        `[prisma] warm-up failed (attempt ${attempt}/${retries}):`,
        (e as Error)?.message ?? e
      );
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  // Surface the last error so the supervisor sees a clear startup failure.
  throw lastErr;
}
