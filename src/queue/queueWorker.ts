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
 * Run as a separate process or ECS task (RUN_QUEUE_WORKER=true) so API tasks stay stateless and scale independently.
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
  worker = new Worker(APP_QUEUE_NAME, processJob, { connection: connection as any });

  worker.on("failed", (job, err) => {
    console.error("[queue] job failed", job?.id, job?.name, err);
  });

  console.log(`[queue] worker listening on ${APP_QUEUE_NAME}`);
}

export async function closeQueueWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
