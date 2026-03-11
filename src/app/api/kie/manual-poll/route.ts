import { NextRequest, NextResponse } from 'next/server';
import { KIEImageService } from '@/lib/kie-api/kie-image-service';
import { getKIETaskMetadataKV, updateKIETaskMetadataKV } from '@/lib/cloudflare-kv';
import { uploadImageToR2 } from '@/lib/r2';

/**
 * Manual Polling Endpoint (临时调试用)
 *
 * 手动轮询 KIE API 获取任务状态，用于调试 callback 不工作的情况
 *
 * Usage:
 *   POST /api/kie/manual-poll
 *   Body: { "taskId": "kie-xxx" }
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Manually polling task: ${taskId}`);

    // Check if task exists in R2
    const existingMetadata = await getKIETaskMetadataKV(taskId);
    if (!existingMetadata) {
      return NextResponse.json(
        { error: 'Task not found in R2' },
        { status: 404 }
      );
    }

    // Query KIE API for current status
    const kieService = new KIEImageService();
    const taskStatus = await kieService.getTaskStatus(taskId);

    console.log(`📊 KIE task status:`, taskStatus);

    // Process based on status
    if (taskStatus.state === 'success') {
      try {
        // Parse result JSON
        const resultJson = JSON.parse(taskStatus.resultJson);
        const kieImageUrl = resultJson.resultUrls?.[0];

        if (!kieImageUrl) {
          throw new Error('No result URL in KIE response');
        }

        console.log(`📥 Downloading image from KIE: ${kieImageUrl}`);

        // Download image from KIE
        const imageResponse = await fetch(kieImageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(`📦 Downloaded ${imageBuffer.length} bytes`);

        // Upload to our R2
        const filename = `kie-generated-${taskId}.png`;
        const uploadedUrl = await uploadImageToR2(imageBuffer, filename, 'image/png');
        console.log(`☁️  Uploaded to R2: ${uploadedUrl}`);

        // Update R2 metadata
        await updateKIETaskMetadataKV(taskId, {
          status: 'completed',
          resultUrls: [uploadedUrl],
          consumeCredits: taskStatus.consumeCredits,
          costTime: taskStatus.costTime,
        });

        return NextResponse.json({
          success: true,
          message: 'Task completed and metadata updated',
          taskId,
          status: 'completed',
          imageUrl: uploadedUrl,
          consumeCredits: taskStatus.consumeCredits,
          costTime: taskStatus.costTime,
        });
      } catch (error) {
        console.error('❌ Failed to process completed task:', error);

        // Mark as failed
        await updateKIETaskMetadataKV(taskId, {
          status: 'failed',
          error: `Failed to process result: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });

        return NextResponse.json({
          success: false,
          error: 'Failed to process completed task',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    if (taskStatus.state === 'failed') {
      await updateKIETaskMetadataKV(taskId, {
        status: 'failed',
        error: 'KIE task failed',
      });

      return NextResponse.json({
        success: false,
        message: 'Task failed on KIE side',
        taskId,
        status: 'failed',
      });
    }

    // Still processing
    return NextResponse.json({
      success: true,
      message: 'Task still processing',
      taskId,
      status: 'processing',
      state: taskStatus.state,
    });

  } catch (error) {
    console.error('❌ Manual poll error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
