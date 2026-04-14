import dotenv from "dotenv";
import path from "path";

/**
 * Must be imported before any module that reads process.env at load time (e.g. redis.ts).
 */
const root = process.cwd();
dotenv.config({ path: path.join(root, ".env") });

const localFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: path.join(root, localFile), override: true });
