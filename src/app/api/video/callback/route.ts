import { NextRequest, NextResponse } from 'next/server'
import {
  KIEVideoService,
  type SeedanceCallbackResponse,
} from '@/lib/kie-api/kie-video-service'
import {
  AISpliceVideoService,
  type AISpliceTaskStatusResponse,
} from '@/lib/aisplice-api/aisplice-video-service'
import {
  getKIETaskMetadataKV,
  updateKIETaskMetadataKV,
} from '@/lib/cloudflare-kv'
import { uploadBufferToR2, getPublicUrl } from '@/lib/r2'
import { createServiceClient } from '@/lib/supabase-server'

/**
 * Seedance 2 Fast Video Callback Handler
 *
 * Receives webhooks from KIE.ai when Seedance video generation completes.
 * On success: downloads the mp4 from KIE's CDN, uploads to R2, updates KV.
 * On failure: updates KV with the error message.
 *
 * Security: Public endpoint — KIE.ai does not currently sign callbacks.
 * We validate that the taskId exists in KV before doing any work to limit
 * abuse from unsolicited POSTs.
 *
 * POC scope: KV is the only persistence. Production should additionally
 *   - insert a row into a `videos` Supabase table
 *   - refund credits on failure (transaction_type='refund')
 *   - verify webhook origin via shared secret in the URL
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received Seedance video callback')

    const rawBody = await request.json()
    console.log('📦 Callback data:', JSON.stringify(rawBody, null, 2))

    const isAISplicePayload =
      typeof rawBody === 'object' &&
      rawBody !== null &&
      !('data' in rawBody && typeof rawBody.data === 'object' && rawBody.data !== null && 'taskId' in rawBody.data) &&
      ('task_id' in rawBody || 'status' in rawBody)

    let processed: {
      taskId: string
      success: boolean
      videoUrl?: string
      error?: string
    }

    if (isAISplicePayload) {
      const aisplicePayload = rawBody as AISpliceTaskStatusResponse
      const norm = AISpliceVideoService.normalizeTaskStatus(
        aisplicePayload.task_id || aisplicePayload.id || '',
        aisplicePayload
      )
      processed = {
        taskId: norm.taskId,
        success: norm.state === 'success',
        videoUrl: norm.videoUrl,
        error: norm.error,
      }
    } else {
      const callbackData = rawBody as SeedanceCallbackResponse
      processed = KIEVideoService.processCallback(callbackData)
    }

    console.log('✅ Processed callback:', processed)

    // Look up the videos row (production-path) OR KV (POC-path).
    // Either is sufficient to confirm the task is legitimate.
    const serviceSupabase = createServiceClient()
    const { data: videoRow } = await serviceSupabase
      .from('videos')
      .select('id, user_id, effect_type, cost, status, preset_id, metadata')
      .eq('external_task_id', processed.taskId)
      .maybeSingle()

    const kvExisting = await getKIETaskMetadataKV(processed.taskId)

    if (!videoRow && !kvExisting) {
      console.warn(
        `⚠️  Callback received for unknown taskId: ${processed.taskId}`
      )
      // Return 200 so KIE does not retry an irrelevant task.
      return NextResponse.json({
        success: false,
        error: 'Task not found',
        message: 'Ignoring callback for unknown task',
      })
    }

    // Idempotency guard: if the task already reached a terminal state (e.g. via
    // /api/video/task-status polling or a duplicate webhook delivery), return 200
    // immediately without re-downloading or re-processing.
    if (videoRow && !kvExisting && videoRow.status !== 'processing') {
      return NextResponse.json({
        success: true,
        taskId: processed.taskId,
        message: `Task already in terminal state (${videoRow.status})`,
      })
    }

    if (
      isAISplicePayload ||
      videoRow?.effect_type === 'ai-seedance-2-5' ||
      videoRow?.metadata?.paid_trial
    ) {
      // Verify upstream task state directly before mutating credits or R2 storage.
      if (isAISplicePayload || videoRow?.effect_type === 'ai-seedance-2-5') {
        try {
          const norm = await new AISpliceVideoService().getTaskStatus(processed.taskId)
          if (norm.state === 'waiting') {
            return NextResponse.json({ success: false, message: 'Task is still processing' })
          }
          processed = {
            taskId: norm.taskId,
            success: norm.state === 'success',
            videoUrl: norm.videoUrl || processed.videoUrl,
            error: norm.error || processed.error,
          }
        } catch {
          return NextResponse.json({ success: false, error: 'Could not verify provider task' }, { status: 503 })
        }
      } else {
        let task
        try {
          task = await new KIEVideoService().getTaskStatus(processed.taskId)
        } catch {
          return NextResponse.json({ success: false, error: 'Could not verify provider task' }, { status: 503 })
        }
        if (task.state !== 'success' && task.state !== 'fail') {
          return NextResponse.json({ success: false, message: 'Task is still processing' })
        }
        processed = KIEVideoService.processCallback({ code: 200, msg: 'success', data: task })
      }
    }

    // ---- Failure path ----
    if (!processed.success || (!processed.videoUrl && !isAISplicePayload)) {
      console.log(`❌ Task ${processed.taskId} failed: ${processed.error}`)

      if (kvExisting) {
        await updateKIETaskMetadataKV(processed.taskId, {
          status: 'failed',
          error: processed.error || 'Unknown failure',
        })
      }

      // Production path: mark the videos row failed and refund credits.
      if (videoRow && videoRow.status === 'processing') {
        await serviceSupabase
          .from('videos')
          .update({
            status: 'failed',
            error_message: processed.error || 'Unknown failure',
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoRow.id)

        const { error: refundError } = await serviceSupabase.rpc('refund_video_credits', {
          p_video_id: videoRow.id, p_reason: `Refund for failed video task ${processed.taskId}`,
          p_provider_charged: false,
        })

        if (refundError) {
          console.error(
            `⚠️  Failed to refund ${videoRow.cost} credits for video ${videoRow.id}:`,
            refundError
          )
        } else {
          console.log(
            `💰 Refunded ${videoRow.cost} credits to user ${videoRow.user_id}`
          )
        }
      }

      return NextResponse.json({
        success: false,
        taskId: processed.taskId,
        error: processed.error,
      })
    }

    // ---- Success path: Provider CDN → R2 ----
    console.log(
      `🎬 Task ${processed.taskId} succeeded. Source: ${processed.videoUrl ?? '(AISplice /content)'}`
    )

    try {
      const mp4Buffer =
        isAISplicePayload || videoRow?.effect_type === 'ai-seedance-2-5'
          ? await new AISpliceVideoService().downloadVideoBuffer(
              processed.taskId,
              processed.videoUrl
            )
          : await downloadWithRetry(processed.videoUrl!, 3, 60_000)
      console.log(`📦 Downloaded ${mp4Buffer.length} bytes`)

      const r2Key =
        isAISplicePayload || videoRow?.effect_type === 'ai-seedance-2-5'
          ? `videos/seedance-2-5-${processed.taskId}.mp4`
          : `videos/seedance-${processed.taskId}.mp4`
      await uploadBufferToR2({
        key: r2Key,
        body: mp4Buffer,
        contentType: 'video/mp4',
        metadata: {
          taskId: processed.taskId,
          source:
            isAISplicePayload || videoRow?.effect_type === 'ai-seedance-2-5'
              ? 'aisplice-seedance-2-5'
              : 'kie-seedance-2-fast',
        },
      })

      const r2Url = getPublicUrl(r2Key)
      console.log(`☁️  Uploaded to R2: ${r2Url}`)

      if (kvExisting && !isAISplicePayload) {
        const callbackData = rawBody as SeedanceCallbackResponse
        await updateKIETaskMetadataKV(processed.taskId, {
          status: 'completed',
          resultUrls: [r2Url],
          consumeCredits: callbackData.data?.consumeCredits,
          costTime: callbackData.data?.costTime,
        })
      }

      // Production path: mark the videos row completed.
      if (videoRow && videoRow.status === 'processing') {
        const { error: updateError } = await serviceSupabase
          .from('videos')
          .update({
            status: 'completed',
            video_url: r2Url,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoRow.id)

        if (updateError) {
          console.error('Failed to mark videos row completed:', updateError)
        }
      }

      return NextResponse.json({
        success: true,
        taskId: processed.taskId,
        videoUrl: r2Url,
      })
    } catch (downloadError) {
      console.error('❌ Failed to download/upload mp4:', downloadError)
      const errMsg = `Failed to download result: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`

      if (kvExisting) {
        await updateKIETaskMetadataKV(processed.taskId, {
          status: 'failed',
          error: errMsg,
        })
      }

      // Production path: mark videos row failed + refund credits
      if (videoRow && videoRow.status === 'processing') {
        await serviceSupabase
          .from('videos')
          .update({
            status: 'failed',
            error_message: errMsg,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoRow.id)

        const { error: refundError } = await serviceSupabase.rpc('refund_video_credits', {
          p_video_id: videoRow.id, p_reason: `Refund for download failure on video task ${processed.taskId}`,
          p_provider_charged: true,
        })
        if (refundError) console.error('Video credit refund failed:', refundError)
      }

      // 200 to prevent KIE retries (the failure is on our side, not theirs).
      return NextResponse.json({
        success: false,
        error: 'Failed to download result video',
        taskId: processed.taskId,
      })
    }
  } catch (error) {
    console.error('❌ Video callback handler error:', error)
    // Always return 200 so KIE does not retry on errors we already logged.
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 200 }
    )
  }
}

/**
 * Fetch a binary file with retries and per-attempt timeout.
 * Modeled on the helper used in /api/kie/callback for image downloads.
 */
async function downloadWithRetry(
  url: string,
  attempts: number,
  timeoutMs: number
): Promise<Buffer> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) {
        throw new Error(
          `Fetch failed: ${response.status} ${response.statusText}`
        )
      }
      return Buffer.from(await response.arrayBuffer())
    } catch (err) {
      lastError = err
      console.warn(`⚠️  Download attempt ${attempt}/${attempts} failed:`, err)
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  throw lastError
}
