// MUST be the very first import: every other module below reads
// process.env at module-evaluation time (Prisma reads DATABASE_URL, redis
// reads REDIS_URL, etc.). ES module imports are evaluated before top-level
// statements run, so calling dotenv.config() later is too late
// — that's what was causing Prisma's P1001 ("can't reach database").
import "./loadEnv";

import { Server } from "http";
import app from "./app";
import config from "./config";
import { prisma, warmUpPrisma } from "./app/shared/prisma";
import { disconnectRedis } from "./utils/redis";
import { shutdownQueueLayer } from "./queue/shutdownQueue";
import { startQueueWorker } from "./queue/queueWorker";

let server: Server | undefined;
let shuttingDown = false;

/**
 * Errors that come from the network layer (client disconnected mid-request,
 * upstream socket reset, etc.). Logging + ignoring these is correct —
 * crashing on every flaky client would make the API unrunnable in prod.
 */
const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "EPIPE",
  "ETIMEDOUT",
  "ENOTCONN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EAI_AGAIN", // transient DNS failure
]);

function isTransientNetworkError(err: any): boolean {
  if (!err) return false;
  if (typeof err.code === "string" && TRANSIENT_NETWORK_CODES.has(err.code)) {
    return true;
  }
  // Prisma intermittent connection errors during DB restarts / pool churn
  if (err?.name === "PrismaClientInitializationError") return true;
  if (err?.code === "P1001" || err?.code === "P1017") return true;
  // ioredis / node-redis connection churn
  if (typeof err.message === "string") {
    const m = err.message.toLowerCase();
    if (
      m.includes("connection is closed") ||
      m.includes("stream isn't writeable") ||
      m.includes("the client is closed") ||
      m.includes("socket closed unexpectedly")
    ) {
      return true;
    }
  }
  return false;
}

async function gracefulShutdown(signal: string, exitCode: number = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, draining...`);

  // Force-exit fallback if the close hangs (lingering keep-alive sockets,
  // stuck DB transactions, etc.). Unref so it never blocks normal exit.
  const forceExitTimer = setTimeout(() => {
    console.error("[shutdown] forced exit after 20s");
    process.exit(1);
  }, 20_000);
  forceExitTimer.unref();

  const cleanup = async () => {
    try {
      await shutdownQueueLayer();
    } catch (e) {
      console.error("[shutdown] queue cleanup error:", e);
    }
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("[shutdown] prisma disconnect error:", e);
    }
    try {
      await disconnectRedis();
    } catch (e) {
      console.error("[shutdown] redis disconnect error:", e);
    }
    console.log("[shutdown] complete");
    process.exit(exitCode);
  };

  if (!server) {
    await cleanup();
    return;
  }

  server.close(async () => {
    await cleanup();
  });
}

async function bootstrap() {
  try {
    await warmUpPrisma();

    server = app.listen(config.port || 7000, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
    });

    // Keep-alive + headers timeouts tuned to sit behind nginx/ALB without
    // 502s from premature socket closes. headersTimeout must be > keepAlive.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 70_000;
    server.requestTimeout = 120_000;

    startQueueWorker();

    // Silently absorb client-disconnect errors — not a server bug.
    server.on("clientError", (err: NodeJS.ErrnoException, socket) => {
      if (err.code === "ECONNRESET" || !socket.writable) {
        socket.destroy();
        return;
      }
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    // Signal handling: SIGTERM (systemd/docker stop), SIGINT (Ctrl-C),
    // SIGHUP (terminal close — older nohup setups deliver this).
    process.on("SIGTERM", () => void gracefulShutdown("SIGTERM", 0));
    process.on("SIGINT", () => void gracefulShutdown("SIGINT", 0));
    process.on("SIGHUP", () => void gracefulShutdown("SIGHUP", 0));

    /**
     * `unhandledRejection` is almost always recoverable in our app (a stray
     * await inside background work — Stripe webhook, S3 upload, Redis ping).
     * Killing the process on every one of these is the main reason the
     * server "auto stops". We log and keep running unless the error proves
     * the process is in a corrupt state.
     */
    process.on("unhandledRejection", (reason: any) => {
      if (isTransientNetworkError(reason)) {
        console.warn(
          `[net] unhandledRejection ignored: ${reason?.code ?? reason?.name}`
        );
        return;
      }
      console.error("[unhandledRejection]", reason);
      // Do NOT exit — let the supervisor decide based on liveness probe.
    });

    /**
     * `uncaughtException` is more serious — the JS stack just unwound past
     * every catch. For transient network codes we still tolerate, but for
     * anything else we shut down gracefully and let PM2/systemd restart.
     */
    process.on("uncaughtException", (error: NodeJS.ErrnoException) => {
      if (isTransientNetworkError(error)) {
        console.warn(`[net] uncaughtException ignored: ${error.code}`);
        return;
      }
      console.error("[uncaughtException] — shutting down", error);
      void gracefulShutdown("uncaughtException", 1);
    });

    // Track memory pressure so PM2 can restart before the OOM killer hits.
    if (process.env.LOG_MEMORY === "true") {
      setInterval(() => {
        const m = process.memoryUsage();
        console.log(
          `[mem] rss=${(m.rss / 1024 / 1024).toFixed(0)}MB heap=${(
            m.heapUsed / 1024 / 1024
          ).toFixed(0)}/${(m.heapTotal / 1024 / 1024).toFixed(0)}MB`
        );
      }, 60_000).unref();
    }
  } catch (error) {
    console.error("[bootstrap] startup failed:", error);
    process.exit(1);
  }
}

bootstrap();
