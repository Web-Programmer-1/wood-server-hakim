import { closeAppQueue } from "./appQueue";
import { closeQueueWorker } from "./queueWorker";

export async function shutdownQueueLayer(): Promise<void> {
  await closeQueueWorker();
  await closeAppQueue();
}
