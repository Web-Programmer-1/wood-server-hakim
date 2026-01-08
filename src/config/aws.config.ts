

import { S3Client } from "@aws-sdk/client-s3";
// Ensure dotenv is loaded before checking environment variables
import dotenv from "dotenv";
import path from "path";

// Load .env file if it exists (won't override existing env vars from Docker/system)
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Validate required AWS environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required AWS environment variables: ${missingVars.join(", ")}. ` +
    `Please ensure these are set in your .env file or Docker environment variables.`
  );
}

export const s3 = new S3Client({
  region: requiredEnvVars.AWS_REGION!,
  endpoint: `https://s3.${requiredEnvVars.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID!,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY!,
  },
});
