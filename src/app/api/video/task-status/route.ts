import { NextRequest, NextResponse } from 'next/server'
import {
  createAuthenticatedClient,
  createServiceClient,
} from '@/lib/supabase-server'

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
      .select('user_id, status, video_url, thumbnail_url, error_message')
      .eq('task_id', taskId)
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
