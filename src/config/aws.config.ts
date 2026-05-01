import { S3Client } from "@aws-sdk/client-s3";

// ----------------------------------------------------------------------
// Backblaze B2 (S3-compatible) configuration.
//
// Prefers BB_S3_* environment variables. Falls back to legacy AWS_* vars
// so existing deployments keep working until the cutover is complete.
// ----------------------------------------------------------------------

const rawEndpoint =
  process.env.BB_S3_ENDPOINT ||
  (process.env.AWS_REGION
    ? `https://s3.${process.env.AWS_REGION}.amazonaws.com`
    : "");

if (!rawEndpoint) {
  throw new Error(
    "S3 endpoint is not defined. Set BB_S3_ENDPOINT (Backblaze) or AWS_REGION (AWS).",
  );
}

// Allow the endpoint to be configured with or without a protocol prefix.
export const S3_ENDPOINT = /^https?:\/\//i.test(rawEndpoint)
  ? rawEndpoint
  : `https://${rawEndpoint}`;

export const S3_REGION =
  process.env.BB_S3_REGION || process.env.AWS_REGION || "us-east-1";

export const BUCKET_NAME = (process.env.BB_S3_BUCKET_NAME ||
  process.env.AWS_BUCKET_NAME)!;

if (!BUCKET_NAME) {
  throw new Error(
    "S3 bucket is not defined. Set BB_S3_BUCKET_NAME or AWS_BUCKET_NAME.",
  );
}

const accessKeyId =
  process.env.BB_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.BB_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "S3 credentials missing. Set BB_S3_ACCESS_KEY_ID/BB_S3_SECRET_ACCESS_KEY (or the AWS_* equivalents).",
  );
}

export const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  // Backblaze B2 requires path-style URLs. Harmless on AWS too.
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Public URL builder. multer-s3 sets `file.location` automatically using
// the same path-style scheme, so this is exported for code paths that
// build URLs themselves (multipart uploads, etc.).
export const publicUrlForKey = (key: string) =>
  `${S3_ENDPOINT.replace(/\/+$/, "")}/${BUCKET_NAME}/${key}`;

// Best-effort key extractor that works for both Backblaze B2 path-style
// URLs (https://s3.<region>.backblazeb2.com/<bucket>/<key>) and legacy
// AWS URLs (https://s3.<region>.amazonaws.com/<bucket>/<key> or
// https://<bucket>.s3.<region>.amazonaws.com/<key>).
export const extractKeyFromUrl = (fileUrl: string): string | null => {
  if (!fileUrl) return null;

  const bucketMarker = `/${BUCKET_NAME}/`;
  const idx = fileUrl.indexOf(bucketMarker);
  if (idx !== -1) {
    return fileUrl.slice(idx + bucketMarker.length);
  }

  // Virtual-hosted style: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const awsVirtualHost = fileUrl.match(/^https?:\/\/[^/]+\.amazonaws\.com\/(.+)$/i);
  if (awsVirtualHost) return awsVirtualHost[1];

  // Path style on amazonaws: https://s3.<region>.amazonaws.com/<bucket>/<key>
  const awsPathStyle = fileUrl.split(".amazonaws.com/")[1];
  if (awsPathStyle) {
    const parts = awsPathStyle.split("/");
    return parts.slice(1).join("/") || null;
  }

  return null;
};
