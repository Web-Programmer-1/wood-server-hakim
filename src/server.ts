import { Server } from 'http';
import app from './app';
import config from './config';
import dotenv from "dotenv";
import { prisma, warmUpPrisma } from './app/shared/prisma';
import { disconnectRedis } from './utils/redis';
import { shutdownQueueLayer } from './queue/shutdownQueue';
import { startQueueWorker } from './queue/queueWorker';


const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

dotenv.config({ path: envFile });

let server: Server | undefined;

async function gracefulShutdown(signal: string, exitCode: number = 0) {
  console.log(`${signal} received, closing server...`);
  if (!server) {
    process.exit(exitCode);
    return;
  }
  server.close(async () => {
    try {
      await shutdownQueueLayer();
      await prisma.$disconnect();
      await disconnectRedis();
    } catch (e) {
      console.error("Shutdown cleanup error:", e);
    }
    console.log("Server closed gracefully.");
    process.exit(exitCode);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 15_000).unref();
}

async function bootstrap() {
    try {
        await warmUpPrisma();

        server = app.listen(config.port, () => {
            console.log(`🚀 Server is running on http://localhost:${config.port}`);
        });

        startQueueWorker();

        process.on('SIGTERM', () => void gracefulShutdown('SIGTERM', 0));
        process.on('SIGINT', () => void gracefulShutdown('SIGINT', 0));

        process.on('unhandledRejection', (error) => {
            console.error('Unhandled Rejection — closing server...', error);
            void gracefulShutdown('unhandledRejection', 1);
        });
    } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
}

bootstrap();
