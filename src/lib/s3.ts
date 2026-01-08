import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '@/lib/errors';
import { env } from '@/lib/env';

const DEFAULT_UPLOAD_PREFIX = 'uploads';
const DEFAULT_PRESIGN_EXPIRES_SECONDS = 900;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

export type S3UploadConfig = {
  bucket: string;
  region: string;
  prefix: string;
  expiresIn: number;
  maxBytes: number;
};

const resolveS3Region = () => {
  return (
    env.S3_REGION?.trim() ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    ''
  );
};

export const getS3UploadConfig = (): S3UploadConfig => {
  const bucket = env.S3_BUCKET?.trim() || '';
  const region = resolveS3Region().trim();

  if (!bucket || !region) {
    throw new AppError(
      'S3 uploads are not configured. Set S3_BUCKET and S3_REGION (or AWS_REGION).',
      500,
      'S3_NOT_CONFIGURED'
    );
  }

  const prefix = (env.S3_UPLOAD_PREFIX?.trim() || DEFAULT_UPLOAD_PREFIX).replace(/^\/+|\/+$/g, '');
  const expiresIn = env.S3_PRESIGN_EXPIRES_SECONDS ?? DEFAULT_PRESIGN_EXPIRES_SECONDS;
  const maxBytes = env.S3_UPLOAD_MAX_BYTES ?? DEFAULT_MAX_BYTES;

  return { bucket, region, prefix, expiresIn, maxBytes };
};

let cachedClient: S3Client | null = null;

const getS3Client = (region: string) => {
  if (!cachedClient) {
    cachedClient = new S3Client({ region });
  }

  return cachedClient;
};

export async function createPresignedUploadUrl({
  bucket,
  region,
  key,
  contentType,
  expiresIn,
}: {
  bucket: string;
  region: string;
  key: string;
  contentType: string;
  expiresIn: number;
}) {
  const client = getS3Client(region);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}
