import dotenv from "dotenv";
import path from "path";

/**
 * Must be imported before any module that reads process.env at load time
 * (e.g. redis.ts reads REDIS_URL, prisma reads DATABASE_URL).
 *
 * Precedence (highest wins):
 *   1. The real process environment — what docker-compose `environment:`,
 *      PM2, or systemd inject. These are authoritative and must NEVER be
 *      clobbered by a file. (Previously `override: true` did exactly that,
 *      so a stale REDIS_URL in .env.production could silently beat the value
 *      docker-compose set — the Upstash-vs-local-redis footgun.)
 *   2. The environment-specific file (.env.production / .env.local).
 *   3. The base .env (shared defaults).
 */
const root = process.cwd();

// Snapshot the orchestrator-provided env so files can fill gaps but never
// overwrite anything the container/process manager already set.
const injectedEnv = { ...process.env };

// Base defaults first, then let the env-specific file override the base.
dotenv.config({ path: path.join(root, ".env") });

const localFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: path.join(root, localFile), override: true });

// Re-assert the real environment: anything the orchestrator set takes
// priority over both files.
for (const [key, value] of Object.entries(injectedEnv)) {
  if (value !== undefined) process.env[key] = value;
}
