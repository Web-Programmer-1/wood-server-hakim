import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10000,
    timeout: 15000,
  },
});

export async function warmUpPrisma() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("[Prisma] Warm-up failed:", e);
  }
}