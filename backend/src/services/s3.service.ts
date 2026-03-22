import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const s3Service = {
  async uploadTranscript(sessionId: string, data: unknown): Promise<string> {
    const key = `transcripts/${sessionId}.json`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: JSON.stringify(data),
          ContentType: "application/json",
        })
      );
      return key;
    } catch (error) {
      console.error("[S3] Upload failed:", error);
      throw new AppError(502, "Failed to upload transcript to S3");
    }
  },

  async uploadRecording(sessionId: string, buffer: Buffer, contentType: string): Promise<string> {
    const ext = contentType.includes("webm") ? "webm" : "mp4";
    const key = `recordings/${sessionId}.${ext}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      return key;
    } catch (error) {
      console.error("[S3] Recording upload failed:", error);
      throw new AppError(502, "Failed to upload recording to S3");
    }
  },

  async getRecording(key: string): Promise<Buffer | null> {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
        })
      );
      const bytes = await response.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch (error) {
      console.error("[S3] Recording download failed:", error);
      return null;
    }
  },

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
  },

  async getTranscript(key: string): Promise<unknown> {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
        })
      );
      const body = await response.Body?.transformToString();
      return body ? JSON.parse(body) : null;
    } catch (error) {
      console.error("[S3] Download failed:", error);
      throw new AppError(502, "Failed to retrieve transcript from S3");
    }
  },
};
