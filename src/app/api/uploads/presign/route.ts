import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import path from 'path';
import { createPresignedUploadUrl, getS3UploadConfig } from '@/lib/s3';
import { handleApiError, ValidationError } from '@/lib/errors';

export const runtime = 'nodejs';

const uploadTypeSchema = z.enum(['screenshot', 'repo-diff', 'artifact']);

const presignSchema = z.object({
  type: uploadTypeSchema,
  fileName: z.string().min(1).max(200),
  contentType: z
    .string()
    .min(1)
    .max(200)
    .refine((value) => !value.includes('\n') && !value.includes('\r'), {
      message: 'Invalid contentType',
    }),
  contentLength: z.number().int().positive().optional(),
  projectId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  sessionId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  tenantId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

const sanitizeFileName = (fileName: string) => {
  const baseName = path.basename(fileName);
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return sanitized.replace(/^[-.]+/, '').slice(0, 160);
};

const sanitizeSegment = (value: string) => {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
};

const buildObjectKey = ({
  prefix,
  type,
  fileName,
  projectId,
  sessionId,
  tenantId,
}: {
  prefix: string;
  type: z.infer<typeof uploadTypeSchema>;
  fileName: string;
  projectId?: string;
  sessionId?: string;
  tenantId?: string;
}) => {
  const cleanedFileName = sanitizeFileName(fileName);
  const extension = path.extname(cleanedFileName).toLowerCase();
  const baseName = cleanedFileName.slice(0, cleanedFileName.length - extension.length);
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80);
  const uniqueName = safeBase ? `${safeBase}-${randomUUID()}${extension}` : `${randomUUID()}${extension}`;

  const now = new Date();
  const datePath = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('/');

  const segments = [
    prefix,
    type,
    tenantId ? sanitizeSegment(tenantId) : undefined,
    projectId ? sanitizeSegment(projectId) : undefined,
    sessionId ? sanitizeSegment(sessionId) : undefined,
    datePath,
    uniqueName,
  ].filter((segment) => segment);

  return segments.join('/');
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, fileName, contentType, contentLength, projectId, sessionId, tenantId } =
      presignSchema.parse(body);

    const { bucket, region, prefix, maxBytes, expiresIn } = getS3UploadConfig();

    if (contentLength && contentLength > maxBytes) {
      throw new ValidationError(`File exceeds max size of ${maxBytes} bytes`);
    }

    const objectKey = buildObjectKey({
      prefix,
      type,
      fileName,
      projectId,
      sessionId,
      tenantId,
    });

    const uploadUrl = await createPresignedUploadUrl({
      bucket,
      region,
      key: objectKey,
      contentType,
      expiresIn,
    });

    return NextResponse.json({
      uploadUrl,
      objectKey,
      bucket,
      region,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
