import { Router, Request, Response } from "express";
import { prisma } from "../app/shared/prisma";
import redis from "../utils/redis";

const router = Router();

/** Fast liveness for ALB / ECS — no DB call */
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
 * Readiness: DB required; Redis optional (if configured, must respond).
 */
router.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (redis && typeof redis.ping === "function") {
      await redis.ping();
    }
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

export default router;
