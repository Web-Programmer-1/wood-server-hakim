/**
 * Dedicated worker process (e.g. separate ECS task): `node dist/workerOnly.js`
 * API server should keep RUN_QUEUE_WORKER unset/false so only this process consumes jobs.
 */
import dotenv from "dotenv";
import { startQueueWorker } from "./queue/queueWorker";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

dotenv.config({ path: envFile });

process.env.RUN_QUEUE_WORKER = "true";
startQueueWorker();
