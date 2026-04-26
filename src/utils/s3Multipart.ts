import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { s3 } from "../config/aws.config";

const BUCKET = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export const buildMachineVideoKey = (originalName: string) => {
  const ext = (originalName.split(".").pop() || "mp4").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "mp4";
  return `machine-videos/${crypto.randomBytes(16).toString("hex")}.${safeExt}`;
};

export const publicUrlForKey = (key: string) =>
  `https://s3.${REGION}.amazonaws.com/${BUCKET}/${key}`;

export const initiateMultipart = async (params: {
  key: string;
  contentType: string;
}) => {
  const out = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET,
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
    Bucket: BUCKET,
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
  });
  return getSignedUrl(s3 as any, cmd as any, {
    expiresIn: params.expiresIn ?? 3600,
  });
};

export const completeMultipart = async (params: {
  key: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}) => {
  const sorted = [...params.parts].sort((a, b) => a.PartNumber - b.PartNumber);
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: { Parts: sorted },
    }),
  );
  return { location: publicUrlForKey(params.key) };
};

export const abortMultipart = async (params: {
  key: string;
  uploadId: string;
}) => {
  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: BUCKET,
      Key: params.key,
      UploadId: params.uploadId,
    }),
  );
};
