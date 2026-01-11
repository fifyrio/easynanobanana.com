import { NextRequest, NextResponse } from 'next/server';
import { KIEImageService } from '@/lib/kie-api/kie-image-service';
import { getKIETaskMetadata, updateKIETaskMetadata } from '@/lib/r2';
import { uploadImageToR2 } from '@/lib/r2';
import { createServiceClient } from '@/lib/supabase-server';
import type { KIECallbackResponse } from '@/lib/kie-api/types';

/**
 * KIE API Callback Handler
 *
 * This endpoint receives webhooks from KIE API when image generation tasks complete.
 * It updates both R2 metadata and Supabase database records.
 *
 * Security: This is a public endpoint (no auth) since KIE doesn't support auth headers.
 * We validate taskId exists before processing to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received KIE callback');

    // Parse callback data
    const callbackData: KIECallbackResponse = await request.json();
    console.log('📦 Callback data:', JSON.stringify(callbackData, null, 2));

    // Process using KIEImageService helper
    const result = KIEImageService.processCallback(callbackData);
    console.log('✅ Processed callback:', result);

    // Validate taskId exists in our system
    const existingMetadata = await getKIETaskMetadata(result.taskId);
    if (!existingMetadata) {
      console.warn(`⚠️  Callback received for unknown taskId: ${result.taskId}`);
      // Return 200 to prevent KIE from retrying unknown tasks
      return NextResponse.json({
        success: false,
        error: 'Task not found',
        message: 'Ignoring callback for unknown task'
      });
    }

    // Initialize Supabase service client
    const supabase = createServiceClient();

    // Handle success case
    if (result.success && result.resultUrls && result.resultUrls.length > 0) {
      console.log(`🎨 Task ${result.taskId} completed successfully`);

      // Download image from KIE result URL
      const kieImageUrl = result.resultUrls[0];
      console.log(`📥 Downloading image from KIE: ${kieImageUrl}`);

      try {
        const imageResponse = await fetch(kieImageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log(`📦 Downloaded ${imageBuffer.length} bytes`);

        // Upload to our R2 storage
        const filename = `kie-generated-${result.taskId}.png`;
        const uploadedUrl = await uploadImageToR2(imageBuffer, filename, 'image/png');
        console.log(`☁️  Uploaded to R2: ${uploadedUrl}`);

        // Update R2 metadata
        await updateKIETaskMetadata(result.taskId, {
          status: 'completed',
          resultUrls: [uploadedUrl], // Use our R2 URL instead of KIE's
          consumeCredits: callbackData.data.consumeCredits,
          costTime: callbackData.data.costTime,
        });

        // Get existing image record to merge metadata
        const { data: existingImage } = await supabase
          .from('images')
          .select('metadata')
          .eq('external_task_id', result.taskId)
          .single();

        // Update Supabase images table
        const { error: dbError } = await supabase
          .from('images')
          .update({
            status: 'completed',
            processed_image_url: uploadedUrl,
            updated_at: new Date().toISOString(),
            metadata: {
              ...(existingImage?.metadata || {}),
              kie_credits: callbackData.data.consumeCredits,
              kie_cost_time: callbackData.data.costTime,
              completed_at: new Date().toISOString()
            }
          })
          .eq('external_task_id', result.taskId);

        if (dbError) {
          console.error('❌ Failed to update database:', dbError);
          // Don't fail the callback - image is already uploaded
        } else {
          console.log('✅ Database updated successfully');
        }

        return NextResponse.json({
          success: true,
          taskId: result.taskId,
          imageUrl: uploadedUrl
        });

      } catch (downloadError) {
        console.error('❌ Failed to download/upload image:', downloadError);

        // Mark task as failed due to download error
        await updateKIETaskMetadata(result.taskId, {
          status: 'failed',
          error: `Failed to download result: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`,
        });

        await supabase
          .from('images')
          .update({
            status: 'failed',
            error_message: `Failed to download result from KIE`,
            updated_at: new Date().toISOString(),
          })
          .eq('external_task_id', result.taskId);

        // Return 200 to prevent retries (permanent failure)
        return NextResponse.json({
          success: false,
          error: 'Failed to download result image',
          taskId: result.taskId
        });
      }
    }

    // Handle failure case
    if (!result.success) {
      console.log(`❌ Task ${result.taskId} failed: ${result.error}`);

      // Update R2 metadata
      await updateKIETaskMetadata(result.taskId, {
        status: 'failed',
        error: result.error || 'Task failed without error message',
      });

      // Update Supabase images table
      await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: result.error || 'KIE task failed',
          updated_at: new Date().toISOString(),
        })
        .eq('external_task_id', result.taskId);

      return NextResponse.json({
        success: false,
        taskId: result.taskId,
        error: result.error
      });
    }

    // Fallback: no results but no error
    console.warn(`⚠️  Task ${result.taskId} completed but no results`);
    return NextResponse.json({
      success: false,
      taskId: result.taskId,
      error: 'No result URLs in callback'
    });

  } catch (error) {
    console.error('❌ Callback handler error:', error);

    // Always return 200 to prevent KIE from retrying on our errors
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 200 }); // Return 200 even on error to prevent retries
  }
}
