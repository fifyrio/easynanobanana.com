import { NextRequest, NextResponse } from 'next/server';
import { getKIETaskMetadataKV, updateKIETaskMetadataKV } from '@/lib/cloudflare-kv';
import { KIEImageService } from '@/lib/kie-api/kie-image-service';
import { uploadImageToR2 } from '@/lib/r2';

// Prevent Vercel from caching this polling endpoint
export const dynamic = 'force-dynamic';

const FALLBACK_POLL_AFTER_MS = 30_000; // 30 seconds

/**
 * KIE Task Status Polling Endpoint
 *
 * Allows clients to check the status of their image generation tasks.
 * If task is still pending after 30s, actively queries KIE API as fallback
 * (in case the callback was never received).
 *
 * Usage:
 *   GET /api/kie/task-status?taskId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId parameter required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking status for task: ${taskId}`);

    const metadata = await getKIETaskMetadataKV(taskId);

    if (!metadata) {
      console.log(`❌ Task not found: ${taskId}`);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Fallback: if task is pending/processing for too long, actively poll KIE API
    if (
      (metadata.status === 'pending' || metadata.status === 'processing') &&
      Date.now() - new Date(metadata.createdAt).getTime() > FALLBACK_POLL_AFTER_MS
    ) {
      console.log(`⏰ Task ${taskId} still ${metadata.status} after ${FALLBACK_POLL_AFTER_MS / 1000}s, fallback polling KIE API...`);

      try {
        const kieService = new KIEImageService();
        const taskStatus = await kieService.getTaskStatus(taskId);

        if (taskStatus.state === 'success') {
          const resultJson = JSON.parse(taskStatus.resultJson);
          const kieImageUrl = resultJson.resultUrls?.[0];

          if (kieImageUrl) {
            console.log(`📥 Fallback: downloading image from KIE: ${kieImageUrl}`);
            const imageResponse = await fetch(kieImageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const filename = `kie-generated-${taskId}.png`;
              const uploadedUrl = await uploadImageToR2(imageBuffer, filename, 'image/png');
              console.log(`☁️ Fallback: uploaded to R2: ${uploadedUrl}`);

              const updated = await updateKIETaskMetadataKV(taskId, {
                status: 'completed',
                resultUrls: [uploadedUrl],
                consumeCredits: taskStatus.consumeCredits,
                costTime: taskStatus.costTime,
              });

              if (updated) {
                return jsonResponse(updated);
              }
            }
          }
        } else if (taskStatus.state === 'failed') {
          console.log(`❌ Fallback: KIE task ${taskId} failed`);
          const updated = await updateKIETaskMetadataKV(taskId, {
            status: 'failed',
            error: 'KIE task failed (detected via fallback polling)',
          });
          if (updated) {
            return jsonResponse(updated);
          }
        }
        // If still processing on KIE side, fall through and return current metadata
      } catch (fallbackError) {
        console.warn(`⚠️ Fallback poll failed for ${taskId}:`, fallbackError);
        // Don't fail the request — just return the current metadata
      }
    }

    console.log(`✅ Task status: ${metadata.status}`);
    return jsonResponse(metadata);

  } catch (error) {
    console.error('❌ Task status query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to query task status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function jsonResponse(metadata: {
  taskId: string;
  status: string;
  prompt?: string;
  resultUrls?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  consumeCredits?: number;
  costTime?: number;
}) {
  return NextResponse.json({
    taskId: metadata.taskId,
    status: metadata.status,
    prompt: metadata.prompt,
    resultUrls: metadata.resultUrls,
    error: metadata.error,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    consumeCredits: metadata.consumeCredits,
    costTime: metadata.costTime,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
