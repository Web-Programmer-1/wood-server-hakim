// MUST be the very first import — same reason as in server.ts.
import "./loadEnv";

/**
 * Dedicated worker process (e.g. separate ECS task): `node dist/workerOnly.js`
 * API server should keep RUN_QUEUE_WORKER unset/false so only this process consumes jobs.
 */
import { startQueueWorker } from "./queue/queueWorker";

process.env.RUN_QUEUE_WORKER = "true";
startQueueWorker();
