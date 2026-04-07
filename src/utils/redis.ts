import { createClient } from "redis";

let redis: any = null;

if (process.env.REDIS_URL) {
  redis = createClient({ url: process.env.REDIS_URL });

  redis.connect().catch((err: any) => {
    console.error("Redis connection failed:", err);
  });
}

export async function disconnectRedis(): Promise<void> {
  if (!redis) return;
  try {
    if (redis.isOpen) {
      await redis.quit();
    }
  } catch (e) {
    console.error("Redis quit error:", e);
  }
}

export default redis;
