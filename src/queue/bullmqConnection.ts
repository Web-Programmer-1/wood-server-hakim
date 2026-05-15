import IORedis from "ioredis";

/**
 * ioredis connection factory for BullMQ.
 *
 * BullMQ requires `maxRetriesPerRequest: null` and `enableReadyCheck: false`
 * on connections used by Workers/QueueEvents (blocking commands).
 *
 * We attach an `error` listener so a TCP drop doesn't emit an unhandled
 * error event and tear down the process via our `uncaughtException` path.
 */
export function createBullMQConnection(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required for the job queue");
  }

  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Backoff: 200ms, 400ms, ... capped at 5s.
    retryStrategy: (times) => Math.min(200 * times, 5000),
    // Buffer commands while reconnecting so transient drops don't surface as
    // synchronous errors to BullMQ.
    enableOfflineQueue: true,
    lazyConnect: false,
    keepAlive: 30_000,
    connectTimeout: 10_000,
  });

  conn.on("error", (err) => {
    console.error("[bullmq-redis] connection error:", err?.message ?? err);
  });
  conn.on("end", () => console.warn("[bullmq-redis] connection ended"));
  conn.on("reconnecting", (delay: number) =>
    console.warn(`[bullmq-redis] reconnecting in ${delay}ms`)
  );
  conn.on("ready", () => console.log("[bullmq-redis] ready"));

  return conn;
}
