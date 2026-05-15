import { Router, Request, Response } from "express";
import { prisma } from "../app/shared/prisma";
import redis, { isRedisReady } from "../utils/redis";

const router = Router();

/** Fast liveness — no DB call. Cheap enough for ALB / uptime monitors. */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "live" });
});

/**
 * Readiness: DB required; Redis only checked if currently ready (skip if
 * mid-reconnect so a flaky Redis doesn't take the API offline).
 */
router.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (redis && isRedisReady()) {
      await redis.ping();
    }
    res.status(200).json({ status: "ready", redis: isRedisReady() });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

export default router;
