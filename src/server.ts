// MUST be the very first import: every other module below reads
// process.env at module-evaluation time (Prisma reads DATABASE_URL, redis
// reads REDIS_URL, etc.). ES module imports are evaluated before top-level
// statements run, so calling dotenv.config() later in this file is too late
// — that's what was causing Prisma's P1001 ("can't reach database").
import "./loadEnv";

import { Server } from 'http';
import app from './app';
import config from './config';
import { prisma, warmUpPrisma } from './app/shared/prisma';
import { disconnectRedis } from './utils/redis';
import { shutdownQueueLayer } from './queue/shutdownQueue';
import { startQueueWorker } from './queue/queueWorker';

let server: Server | undefined;

async function gracefulShutdown(signal: string, exitCode: number = 0) {
  console.log(`${signal} received, closing server...`);
  if (!server) {
    process.exit(exitCode);
    return;
  }
  // Close the server to stop accepting new connections, then clean up resources
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

        server = app.listen(config.port || 7000, () => {
            console.log(`🚀 Server is running on http://localhost:${config.port}`);
        });

        startQueueWorker();

        // Silently absorb client-disconnect errors — not a server bug
        server.on('clientError', (err: NodeJS.ErrnoException, socket) => {
            if (err.code === 'ECONNRESET' || !socket.writable) {
                socket.destroy();
                return;
            }
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });

        process.on('SIGTERM', () => void gracefulShutdown('SIGTERM', 0));
        process.on('SIGINT', () => void gracefulShutdown('SIGINT', 0));

        // Network errors (client disconnect mid-upload/response) are normal — don't crash
        const transientNetworkCodes = new Set(['ECONNRESET', 'ECONNABORTED', 'EPIPE', 'ETIMEDOUT', 'ENOTCONN']);

        process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
            if (transientNetworkCodes.has(error.code ?? '')) {
                console.warn(`[network] uncaughtException ignored: ${error.code}`);
                return;
            }
            console.error('Uncaught Exception — closing server...', error);
            void gracefulShutdown('uncaughtException', 1);
        });

        process.on('unhandledRejection', (error: NodeJS.ErrnoException) => {
            if (transientNetworkCodes.has(error?.code ?? '')) {
                console.warn(`[network] unhandledRejection ignored: ${error?.code}`);
                return;
            }
            console.error('Unhandled Rejection — closing server...', error);
            void gracefulShutdown('unhandledRejection', 1);
        });
    } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
}

bootstrap();
