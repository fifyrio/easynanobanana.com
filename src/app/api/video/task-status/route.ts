import { NextRequest, NextResponse } from 'next/server'
import {
  createAuthenticatedClient,
  createServiceClient,
} from '@/lib/supabase-server'
import { AISpliceVideoService } from '@/lib/aisplice-api/aisplice-video-service'
import { uploadBufferToR2, getPublicUrl } from '@/lib/r2'

/**
 * GET /api/video/task-status?taskId=<KIE task id>
 *
 * Authenticated polling endpoint for the frontend video generator.
 * Returns the status of a video task that belongs to the requesting user.
 *
 * Response shape:
 *   { success: true, data: { status, videoUrl?, thumbnailUrl?, errorMessage? } }
 *
 * Uses the videos table as the source of truth (the webhook callback is
 * responsible for keeping it up to date). RLS is intentionally bypassed via
 * the service client AND ownership is verified explicitly below.
 */

interface ApiSuccess {
  success: true
  data: {
    status: 'processing' | 'completed' | 'failed'
    videoUrl: string | null
    thumbnailUrl: string | null
    errorMessage: string | null
  }
}

interface ApiError {
  success: false
  error: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiSuccess | ApiError>> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = await createAuthenticatedClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const taskId = request.nextUrl.searchParams.get('taskId')
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId query param is required' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: video, error: videoError } = await serviceSupabase
      .from('videos')
      .select('id, user_id, effect_type, status, video_url, thumbnail_url, error_message')
      .eq('external_task_id', taskId)
      .maybeSingle()

    if (videoError) {
      console.error('task-status query failed:', videoError)
      return NextResponse.json(
        { success: false, error: 'Failed to query task' },
        { status: 500 }
      )
    }

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Ownership check — do not leak status of another user's task.
    if (video.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Active upstream reconciliation for AISplice video tasks (`ai-seedance-2-5`)
    // when the row is still in 'processing' state.
    if (video.status === 'processing' && video.effect_type === 'ai-seedance-2-5') {
      try {
        const aisplice = new AISpliceVideoService()
        const upstream = await aisplice.getTaskStatus(taskId)

        if (upstream.state === 'success') {
          const mp4Buffer = await aisplice.downloadVideoBuffer(
            taskId,
            upstream.videoUrl
          )
          const r2Key = `videos/seedance-2-5-${taskId}.mp4`
          await uploadBufferToR2({
            key: r2Key,
            body: mp4Buffer,
            contentType: 'video/mp4',
            metadata: {
              taskId,
              source: 'aisplice-seedance-2-5',
            },
          })
          const r2Url = getPublicUrl(r2Key)

          await serviceSupabase
            .from('videos')
            .update({
              status: 'completed',
              video_url: r2Url,
              completed_at: new Date().toISOString(),
            })
            .eq('id', video.id)
            .eq('status', 'processing')

          return NextResponse.json({
            success: true,
            data: {
              status: 'completed',
              videoUrl: r2Url,
              thumbnailUrl: video.thumbnail_url ?? null,
              errorMessage: null,
            },
          })
        }

        if (upstream.state === 'fail') {
          const errMsg = upstream.error || 'Video generation failed'
          await serviceSupabase
            .from('videos')
            .update({
              status: 'failed',
              error_message: errMsg,
              completed_at: new Date().toISOString(),
            })
            .eq('id', video.id)
            .eq('status', 'processing')

          const { error: refundError } = await serviceSupabase.rpc(
            'refund_video_credits',
            {
              p_video_id: video.id,
              p_reason: `Refund for failed AISplice video task ${taskId}`,
              p_provider_charged: false,
            }
          )
          if (refundError) {
            console.error('AISplice video credit refund failed:', refundError)
          }

          return NextResponse.json({
            success: true,
            data: {
              status: 'failed',
              videoUrl: null,
              thumbnailUrl: video.thumbnail_url ?? null,
              errorMessage: errMsg,
            },
          })
        }
      } catch (pollErr) {
        console.warn('AISplice task-status poll warning (will retry next poll):', pollErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: video.status as 'processing' | 'completed' | 'failed',
        videoUrl: video.video_url ?? null,
        thumbnailUrl: video.thumbnail_url ?? null,
        errorMessage: video.error_message ?? null,
      },
    })
  } catch (error) {
    console.error('video/task-status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
