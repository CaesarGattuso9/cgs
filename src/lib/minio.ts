import { S3Client } from "@aws-sdk/client-s3";

const useSsl = process.env.MINIO_USE_SSL === "true";
const rawEndpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const endpoint = rawEndpoint.startsWith("http")
  ? rawEndpoint
  : `${useSsl ? "https" : "http"}://${rawEndpoint}`;

export const minioBucket = process.env.MINIO_BUCKET || "lifelog-media";

export const minioClient = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
});

export function buildPublicObjectUrl(objectKey: string) {
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || endpoint;
  return `${publicEndpoint.replace(/\/$/, "")}/${minioBucket}/${objectKey}`;
}
