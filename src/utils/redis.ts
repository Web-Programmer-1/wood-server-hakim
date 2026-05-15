import { createClient, RedisClientType } from "redis";

/**
 * Shared node-redis client used for OTP / token / cache reads.
 *
 * Hardening notes:
 * - `error` listener is mandatory. Without it the client emits an unhandled
 *   error on any TCP drop and the process exits.
 * - Reconnect strategy uses exponential backoff capped at 5s so transient
 *   Upstash drops don't turn into a hot reconnect loop.
 * - All call sites must handle `null` (REDIS_URL unset) — keep that contract.
 */

let redis: RedisClientType | null = null;
let connecting = false;

if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
      // Bounded exponential backoff: 100ms, 200ms, 400ms ... capped at 5s.
      reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 5000),
      keepAlive: true,
      connectTimeout: 10_000,
    },
  });

  redis.on("error", (err) => {
    console.error("[redis] client error:", err?.message ?? err);
  });

  redis.on("reconnecting", () => {
    console.warn("[redis] reconnecting...");
  });

  redis.on("ready", () => {
    console.log("[redis] connected");
  });

  redis.on("end", () => {
    console.warn("[redis] connection closed");
  });

  connecting = true;
  redis
    .connect()
    .catch((err) => {
      console.error("[redis] initial connect failed:", err?.message ?? err);
    })
    .finally(() => {
      connecting = false;
    });
}

export function isRedisReady(): boolean {
  return !!redis && redis.isOpen && redis.isReady;
}

export async function disconnectRedis(): Promise<void> {
  if (!redis) return;
  try {
    if (redis.isOpen) {
      await redis.quit();
    }
  } catch (e) {
    console.error("[redis] quit error:", e);
  }
}

export default redis;
