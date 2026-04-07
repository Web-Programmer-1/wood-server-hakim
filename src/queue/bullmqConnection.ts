import IORedis from "ioredis";

/**
 * BullMQ requires dedicated connections; maxRetriesPerRequest must be null.
 */
export function createBullMQConnection(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required for the job queue");
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
  });
}
