import { Queue } from "bullmq";
import { createBullMQConnection } from "./bullmqConnection";

export const APP_QUEUE_NAME = "woods-jobs";

let queueInstance: Queue | null = null;

export function getAppQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (!queueInstance) {
    const connection = createBullMQConnection();
    queueInstance = new Queue(APP_QUEUE_NAME, { connection });
  }
  return queueInstance;
}

/**
 * Enqueue background work (emails, reports, webhooks). Requires REDIS_URL.
 */
export async function addJob(
  name: string,
  data: Record<string, unknown>,
  opts?: { delay?: number; attempts?: number }
) {
  const q = getAppQueue();
  if (!q) {
    throw new Error("Queue unavailable: set REDIS_URL");
  }
  return q.add(name, data, {
    attempts: opts?.attempts ?? 3,
    backoff: { type: "exponential", delay: 2000 },
    ...(opts?.delay != null ? { delay: opts.delay } : {}),
  });
}

export async function closeAppQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
