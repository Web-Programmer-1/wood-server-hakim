import { Worker, Job } from "bullmq";
import { APP_QUEUE_NAME } from "./appQueue";
import { createBullMQConnection } from "./bullmqConnection";

let worker: Worker | null = null;

async function processJob(job: Job): Promise<void> {
  switch (job.name) {
    case "ping":
      return;
    default:
      console.warn(`[queue] unhandled job name: ${job.name}`, job.id);
  }
}

/**
 * Run as a separate process (RUN_QUEUE_WORKER=true) so the API stays
 * stateless and the worker can scale independently.
 */
export function startQueueWorker(): void {
  if (process.env.RUN_QUEUE_WORKER !== "true") return;
  if (!process.env.REDIS_URL) {
    console.warn(
      "[queue] RUN_QUEUE_WORKER=true but REDIS_URL is missing — worker not started"
    );
    return;
  }

  const connection = createBullMQConnection();
  worker = new Worker(APP_QUEUE_NAME, processJob, {
    connection: connection as any,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
  });

  worker.on("failed", (job, err) => {
    console.error("[queue] job failed", job?.id, job?.name, err?.message ?? err);
  });
  worker.on("error", (err) => {
    // Without this listener, ioredis errors bubble up as unhandled.
    console.error("[queue] worker error:", err?.message ?? err);
  });
  worker.on("stalled", (jobId) => {
    console.warn("[queue] job stalled:", jobId);
  });

  console.log(`[queue] worker listening on ${APP_QUEUE_NAME}`);
}

export async function closeQueueWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
