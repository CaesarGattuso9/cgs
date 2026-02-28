import { randomUUID } from "crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { buildPublicObjectUrl, minioBucket, minioClient } from "@/lib/minio";

export const runtime = "nodejs";

const imageSizes = [
  { key: "thumbnail", width: 320 },
  { key: "medium", width: 960 },
  { key: "large", width: 1600 },
] as const;

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const uploadId = randomUUID();
  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const now = new Date().toISOString().slice(0, 10);

  if (file.type.startsWith("image/")) {
    const uploads = await Promise.all(
      imageSizes.map(async (item) => {
        const objectKey = `${now}/${uploadId}-${item.key}.webp`;
        const output = await sharp(sourceBuffer)
          .rotate()
          .resize(item.width, null, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 84 })
          .toBuffer();

        await minioClient.send(
          new PutObjectCommand({
            Bucket: minioBucket,
            Key: objectKey,
            Body: output,
            ContentType: "image/webp",
          }),
        );

        return { key: item.key, url: buildPublicObjectUrl(objectKey) };
      }),
    );

    const result = uploads.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.url;
      return acc;
    }, {});

    return NextResponse.json(
      {
        type: "image",
        originalName: file.name,
        ...result,
      },
      { status: 201 },
    );
  }

  const objectKey = `${now}/${uploadId}.${extension}`;
  await minioClient.send(
    new PutObjectCommand({
      Bucket: minioBucket,
      Key: objectKey,
      Body: sourceBuffer,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return NextResponse.json(
    {
      type: "binary",
      originalName: file.name,
      url: buildPublicObjectUrl(objectKey),
    },
    { status: 201 },
  );
}
