import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, _Object } from '@aws-sdk/client-s3';
import type { KIETaskMetadata } from './kie-api/types';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

// ===== FFmpeg Setup (for video processing) =====

try {
  if (ffmpegStatic) {
    console.log('Setting FFmpeg path to:', ffmpegStatic);
    ffmpeg.setFfmpegPath(ffmpegStatic);
  } else {
    console.warn('ffmpeg-static not found, trying system ffmpeg');
    ffmpeg.setFfmpegPath('ffmpeg');
  }
} catch (error) {
  console.error('Error setting FFmpeg path:', error);
  ffmpeg.setFfmpegPath('ffmpeg');
}

// ===== Environment Variables =====

/**
 * Helper to read required environment variables with descriptive errors.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const accountId = requireEnv('R2_ACCOUNT_ID');
const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
const bucketName = requireEnv('R2_BUCKET_NAME');
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');

/**
 * Singleton R2 client configured for Cloudflare's S3-compatible API.
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Builds the public URL for a given object key.
 * Falls back to the default public bucket domain if R2_PUBLIC_BASE_URL is not provided.
 */
export function getPublicUrl(key: string): string {
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }

  // Default public URL pattern for R2 buckets with public access enabled
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

interface UploadBufferOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

/**
 * Uploads binary data to R2.
 */
export async function uploadBufferToR2(options: UploadBufferOptions): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
    CacheControl: options.cacheControl ?? 'public, max-age=31536000, immutable',
    Metadata: options.metadata,
  });

  await r2Client.send(command);
}

/**
 * Uploads JSON content to R2.
 */
export async function uploadJsonToR2(key: string, data: Record<string, unknown>): Promise<void> {
  const body = Buffer.from(JSON.stringify(data, null, 2));
  await uploadBufferToR2({
    key,
    body,
    contentType: 'application/json',
    cacheControl: 'no-cache',
  });
}

/**
 * Lists objects stored in the configured bucket.
 */
export async function listObjects(prefix = '', maxKeys = 1000): Promise<_Object[]> {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);
  return response.Contents ?? [];
}

export function getBucketName(): string {
  return bucketName;
}

export async function deleteObjectFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await r2Client.send(command);
  } catch (error) {
    if ((error as { name?: string }).name === 'NoSuchKey') {
      return;
    }
    throw error;
  }
}

/**
 * KIE 任务元数据管理
 */

// 生成任务元数据的 R2 Key
function getTaskMetadataKey(taskId: string): string {
  return `kie-tasks/${taskId}.json`;
}

/**
 * 保存 KIE 任务元数据到 R2
 */
export async function saveKIETaskMetadata(metadata: KIETaskMetadata): Promise<void> {
  const key = getTaskMetadataKey(metadata.taskId);
  await uploadJsonToR2(key, metadata as unknown as Record<string, unknown>);
  console.log(`✅ Saved KIE task metadata: ${key}`);
}

/**
 * 从 R2 读取 KIE 任务元数据
 */
export async function getKIETaskMetadata(taskId: string): Promise<KIETaskMetadata | null> {
  const key = getTaskMetadataKey(taskId);

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return null;
    }

    // 读取流数据
    const bodyString = await response.Body.transformToString();
    const metadata = JSON.parse(bodyString) as KIETaskMetadata;

    return metadata;
  } catch (error) {
    // 如果对象不存在，返回 null
    if ((error as { name?: string }).name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * 更新 KIE 任务元数据
 */
export async function updateKIETaskMetadata(
  taskId: string,
  updates: Partial<KIETaskMetadata>
): Promise<KIETaskMetadata | null> {
  const existing = await getKIETaskMetadata(taskId);

  if (!existing) {
    console.warn(`⚠️  Task metadata not found: ${taskId}`);
    return null;
  }

  const updated: KIETaskMetadata = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveKIETaskMetadata(updated);
  return updated;
}

// ===== Specialized Upload Functions (from r2-upload.ts) =====

/**
 * Helper to generate unique filename
 */
function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${prefix ? prefix + '-' : ''}${name}-${timestamp}-${random}${ext}`;
}

/**
 * Extract first frame from video as thumbnail
 */
export async function extractVideoThumbnail(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '400x300',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

/**
 * Upload file to R2 from filesystem path
 */
export async function uploadToR2(
  filePath: string,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    return `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Process and upload video with thumbnail generation
 */
export async function processAndUploadVideo(
  videoPath: string,
  videoTitle: string
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  try {
    const videoFilename = generateUniqueFilename(path.basename(videoPath), 'video');
    const thumbnailFilename = generateUniqueFilename(`${videoTitle}.jpg`, 'thumbnail');

    const tempThumbnailPath = path.join('/tmp', `thumbnail-${Date.now()}.jpg`);

    await extractVideoThumbnail(videoPath, tempThumbnailPath);

    const videoUrl = await uploadToR2(
      videoPath,
      `videos/${videoFilename}`,
      'video/mp4'
    );

    const thumbnailUrl = await uploadToR2(
      tempThumbnailPath,
      `thumbnails/${thumbnailFilename}`,
      'image/jpeg'
    );

    try {
      await fs.promises.unlink(tempThumbnailPath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary thumbnail:', cleanupError);
    }

    return { videoUrl, thumbnailUrl };
  } catch (error) {
    console.error('Error processing and uploading video:', error);
    throw error;
  }
}

/**
 * Upload image from buffer to R2
 */
export async function uploadImageToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    const imageFilename = generateUniqueFilename(filename, 'image');

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `images/${imageFilename}`,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    return `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/images/${imageFilename}`;
  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw error;
  }
}

/**
 * Upload all videos from sample_videos directory
 */
export async function uploadSampleVideos(): Promise<Array<{
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  originalFilename: string;
}>> {
  const sampleVideosDir = path.join(process.cwd(), 'sample_videos');
  const results = [];

  try {
    const files = await fs.promises.readdir(sampleVideosDir);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));

    for (const file of videoFiles) {
      const filePath = path.join(sampleVideosDir, file);
      const title = path.basename(file, '.mp4');

      console.log(`Processing ${file}...`);

      try {
        const { videoUrl, thumbnailUrl } = await processAndUploadVideo(filePath, title);

        results.push({
          id: `fallback-${results.length + 1}`,
          title,
          videoUrl,
          thumbnailUrl,
          originalFilename: file
        });

        console.log(`✓ Uploaded ${file}`);
      } catch (error) {
        console.error(`✗ Failed to upload ${file}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error reading sample videos directory:', error);
    throw error;
  }
}
