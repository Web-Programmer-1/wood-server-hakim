import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { BUCKET_NAME, publicUrlForKey, s3 } from "../config/aws.config";

export type S3Part = { PartNumber: number; ETag: string };

export { publicUrlForKey };

export const buildMachineVideoKey = (originalName: string) => {
  const ext = (originalName.split(".").pop() || "mp4").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "mp4";
  return `machine-videos/${crypto.randomBytes(16).toString("hex")}.${safeExt}`;
};

export const initiateMultipart = async (params: {
  key: string;
  contentType: string;
}) => {
  const out = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      ContentType: params.contentType,
    }),
  );
  if (!out.UploadId) throw new Error("S3 did not return an UploadId");
  return { uploadId: out.UploadId };
};

export const signUploadPartUrl = async (params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresIn?: number;
}) => {
  const cmd = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
  });
  return getSignedUrl(s3 as any, cmd as any, {
    expiresIn: params.expiresIn ?? 3600,
  });
};

/**
 * List every part already uploaded for a given multipart upload, handling
 * pagination. Used as the authoritative source of ETags so we don't depend on
 * the browser being able to read S3's ETag response header (which requires
 * `Access-Control-Expose-Headers: ETag` on the bucket CORS config — Backblaze
 * B2's default CORS does NOT expose it).
 */
export const listMultipartParts = async (params: {
  key: string;
  uploadId: string;
}): Promise<S3Part[]> => {
  const collected: S3Part[] = [];
  let partNumberMarker: string | undefined;

  // S3 returns up to 1000 parts per page; loop until IsTruncated is false.
  while (true) {
    const out = await s3.send(
      new ListPartsCommand({
        Bucket: BUCKET_NAME,
        Key: params.key,
        UploadId: params.uploadId,
        PartNumberMarker: partNumberMarker,
      }),
    );

    for (const p of out.Parts ?? []) {
      if (typeof p.PartNumber === "number" && typeof p.ETag === "string") {
        collected.push({ PartNumber: p.PartNumber, ETag: p.ETag });
      }
    }

    if (!out.IsTruncated) break;
    partNumberMarker = out.NextPartNumberMarker;
    if (!partNumberMarker) break;
  }

  return collected.sort((a, b) => a.PartNumber - b.PartNumber);
};

export const completeMultipart = async (params: {
  key: string;
  uploadId: string;
  /**
   * Optional. When omitted, parts are fetched from S3 via ListParts. This is
   * preferred for browser uploads against B2 because the ETag response header
   * is not exposed across CORS by default.
   */
  parts?: S3Part[];
}) => {
  const fetched = params.parts && params.parts.length > 0
    ? [...params.parts]
    : await listMultipartParts({ key: params.key, uploadId: params.uploadId });

  if (fetched.length === 0) {
    throw new Error("No parts found for this multipart upload");
  }

  const sorted = fetched.sort((a, b) => a.PartNumber - b.PartNumber);

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: { Parts: sorted },
    }),
  );
  return { location: publicUrlForKey(params.key), partCount: sorted.length };
};

export const abortMultipart = async (params: {
  key: string;
  uploadId: string;
}) => {
  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: params.key,
      UploadId: params.uploadId,
    }),
  );
};
