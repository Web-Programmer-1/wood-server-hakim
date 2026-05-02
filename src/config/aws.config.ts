import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

// =====================================================================
// Backblaze B2 (S3-compatible) configuration.
//
// All uploads go to a Backblaze B2 bucket fronted by a Cloudflare CDN.
// Public URLs returned to clients use BB_CDN_BASE_URL so files load via
// the CDN instead of hitting B2 directly.
// =====================================================================

type MulterS3Options = NonNullable<Parameters<typeof multerS3>[0]>;

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const rawEndpoint = requireEnv("BB_S3_ENDPOINT");

// Endpoint may be configured with or without the protocol prefix.
export const S3_ENDPOINT = /^https?:\/\//i.test(rawEndpoint)
  ? rawEndpoint
  : `https://${rawEndpoint}`;

export const S3_REGION = requireEnv("BB_S3_REGION");
export const BUCKET_NAME = requireEnv("BB_S3_BUCKET_NAME");

const accessKeyId = requireEnv("BB_S3_ACCESS_KEY_ID");
const secretAccessKey = requireEnv("BB_S3_SECRET_ACCESS_KEY");

// Cloudflare CDN base in front of the bucket. Optional — falls back to the
// raw B2 path-style URL if missing (useful for local dev without a CDN).
const CDN_BASE_URL = (process.env.BB_CDN_BASE_URL || "").replace(/\/+$/, "");

export const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: true, // Backblaze B2 requires path-style URLs.
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  // AWS SDK v3 defaults to "WHEN_SUPPORTED", which bakes
  // x-amz-sdk-checksum-algorithm=CRC32 into presigned PUT URLs. The browser
  // would then need to compute & send x-amz-checksum-crc32 itself; axios in
  // the browser doesn't do this, so every UploadPart fails with a signature
  // mismatch / NetworkError. Backblaze B2 also doesn't fully support flexible
  // checksums. Switch to WHEN_REQUIRED so signed URLs don't require the
  // browser to send a checksum header.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Public URL builder. Prefers the CDN URL when configured.
export const publicUrlForKey = (key: string): string => {
  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${key}`;
  }
  return `${S3_ENDPOINT.replace(/\/+$/, "")}/${BUCKET_NAME}/${key}`;
};

// Best-effort key extractor for any URL we may have stored historically:
//   Cloudflare CDN:  https://cdn.example.com/file/<bucket>/<key>
//   B2 path-style:   https://s3.<region>.backblazeb2.com/<bucket>/<key>
//   Legacy AWS:      https://<bucket>.s3.<region>.amazonaws.com/<key>
//                    https://s3.<region>.amazonaws.com/<bucket>/<key>
export const extractKeyFromUrl = (fileUrl: string): string | null => {
  if (!fileUrl) return null;

  const bucketMarker = `/${BUCKET_NAME}/`;
  const idx = fileUrl.indexOf(bucketMarker);
  if (idx !== -1) {
    return fileUrl.slice(idx + bucketMarker.length);
  }

  const awsVirtualHost = fileUrl.match(
    /^https?:\/\/[^/]+\.amazonaws\.com\/(.+)$/i,
  );
  if (awsVirtualHost) return awsVirtualHost[1];

  const awsPathStyle = fileUrl.split(".amazonaws.com/")[1];
  if (awsPathStyle) {
    const parts = awsPathStyle.split("/");
    return parts.slice(1).join("/") || null;
  }

  return null;
};

// multer-s3 storage factory: pre-fills s3 + bucket and rewrites file.location
// to the CDN URL so every controller automatically gets the right public URL.
export type S3StorageOptions = Omit<MulterS3Options, "s3" | "bucket">;

export const s3Storage = (opts: S3StorageOptions) => {
  // Backblaze B2 does not accept the default canned ACL "private" that
  // multer-s3 sends. Suppress the header by yielding undefined unless the
  // caller explicitly provides an acl. (B2 controls visibility per-bucket.)
  const noAcl: NonNullable<MulterS3Options["acl"]> = ((
    _req: any,
    _file: any,
    cb: (error: any, acl?: string) => void,
  ) => {
    cb(null, undefined);
  }) as any;

  const engine = multerS3({
    acl: noAcl,
    ...(opts as MulterS3Options),
    s3: s3 as any,
    bucket: BUCKET_NAME,
  });

  const original = (engine as any)._handleFile.bind(engine);
  (engine as any)._handleFile = (req: any, file: any, cb: any) => {
    original(req, file, (err: any, info: any) => {
      if (err) return cb(err);
      if (info?.key) info.location = publicUrlForKey(info.key);
      cb(null, info);
    });
  };

  return engine;
};
