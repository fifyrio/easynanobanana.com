import { NextRequest, NextResponse } from 'next/server'
import {
  createAuthenticatedClient,
  createServiceClient,
} from '@/lib/supabase-server'
import { KIEVideoService } from '@/lib/kie-api/kie-video-service'
import aiKissPresetsJson from '@/data/ai-kiss-presets.json'
import aiHistoryCollagePresetsJson from '@/data/ai-history-collage-presets.json'

/**
 * POST /api/video/generate
 *
 * Authenticated endpoint that kicks off a Seedance 2 Fast video generation.
 *
 * Flow:
 *   1. Verify Bearer token → user
 *   2. Validate effect + preset + sourceImageUrl
 *   3. Call RPC `deduct_credits_for_video` (mirrors deduct_credits_for_image):
 *        atomically checks credits, inserts videos row (status='pending'),
 *        inserts credit_transactions usage row. Returns video_id.
 *   4. Submit to KIE → get external taskId
 *   5. UPDATE videos SET external_task_id=taskId, status='processing'
 *      On KIE failure: UPDATE videos SET status='failed' + INSERT refund txn
 *   6. Return { videoId, taskId, creditsDeducted }
 *
 * Recovery: if KIE never delivers callback, a pending video stays as
 * 'processing' indefinitely — handled by a future cron sweep, not B1.
 */

interface AiKissPreset {
  id: string
  name: string
  description: string
  displaySrc: string
  prompt: string
}

type EffectType = 'ai-kiss' | 'ai-history-collage'

interface GenerateRequest {
  effectType: EffectType
  presetId: string
  sourceImageUrl: string
  referenceImageUrls?: string[]
  aspectRatio?: '9:16' | '16:9'
  /** Optional user-provided details appended to the preset prompt. */
  customText?: string
}

interface ApiSuccess {
  success: true
  data: {
    videoId: string
    taskId: string
    creditsDeducted: number
  }
}

interface ApiError {
  success: false
  error: string
  required?: number
  available?: number
}

interface DeductRpcResponse {
  success: boolean
  message?: string
  video_id?: string
  credits_deducted?: number
  remaining_credits?: number
  required?: number
  available?: number
}

const CREDIT_COST = 100
const DURATION_SECONDS = 4
const RESOLUTION = '480p' as const
const DEFAULT_ASPECT_RATIO = '9:16' as const
const ALLOWED_ASPECT_RATIOS = ['9:16', '16:9'] as const
const CUSTOM_TEXT_MAX_LENGTH = 300

interface EffectConfig {
  presets: AiKissPreset[]
  generateAudio: boolean
}

const EFFECTS: Record<EffectType, EffectConfig> = {
  'ai-kiss': {
    presets: (aiKissPresetsJson as { presets: AiKissPreset[] }).presets,
    generateAudio: true,
  },
  // Vox-style history collage animation is intentionally silent (拟定格拼贴).
  'ai-history-collage': {
    presets: (aiHistoryCollagePresetsJson as { presets: AiKissPreset[] }).presets,
    generateAudio: false,
  },
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiSuccess | ApiError>> {
  try {
    // ---- 1. Auth ----
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

    // ---- 2. Validate input ----
    let body: GenerateRequest
    try {
      body = (await request.json()) as GenerateRequest
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const effect = EFFECTS[body.effectType]
    if (!effect) {
      return NextResponse.json(
        { success: false, error: `Unsupported effectType: ${body.effectType}` },
        { status: 400 }
      )
    }

    const preset = effect.presets.find((p) => p.id === body.presetId)
    if (!preset) {
      return NextResponse.json(
        { success: false, error: `Unknown preset: ${body.presetId}` },
        { status: 400 }
      )
    }

    if (!body.sourceImageUrl || !/^https?:\/\//.test(body.sourceImageUrl)) {
      return NextResponse.json(
        { success: false, error: 'sourceImageUrl must be a public http(s) URL' },
        { status: 400 }
      )
    }

    const referenceImageUrls = (body.referenceImageUrls ?? []).filter((u) =>
      /^https?:\/\//.test(u)
    )
    if (referenceImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'referenceImageUrls must contain at least one public URL' },
        { status: 400 }
      )
    }
    if (referenceImageUrls.length > 9) {
      return NextResponse.json(
        { success: false, error: 'referenceImageUrls supports at most 9 images' },
        { status: 400 }
      )
    }

    const aspectRatio = body.aspectRatio && ALLOWED_ASPECT_RATIOS.includes(body.aspectRatio)
      ? body.aspectRatio
      : DEFAULT_ASPECT_RATIO

    const customText =
      typeof body.customText === 'string'
        ? body.customText.trim().slice(0, CUSTOM_TEXT_MAX_LENGTH)
        : ''
    const finalPrompt = customText
      ? `${preset.prompt} Additional user details: ${customText}`
      : preset.prompt

    // ---- 3. Atomic credit deduction + pending video row via RPC ----
    const serviceSupabase = createServiceClient()
    const { data: rpcData, error: rpcError } = await serviceSupabase.rpc(
      'deduct_credits_for_video',
      {
        user_uuid: user.id,
        p_effect_type: body.effectType,
        p_preset_id: preset.id,
        p_prompt: finalPrompt,
        p_source_image_url: body.sourceImageUrl,
        p_title: preset.name,
        credits_to_deduct: CREDIT_COST,
        p_duration: DURATION_SECONDS,
        p_resolution: RESOLUTION,
        p_aspect_ratio: aspectRatio,
        p_generate_audio: effect.generateAudio,
      }
    )

    if (rpcError) {
      console.error('deduct_credits_for_video RPC failed:', rpcError)
      return NextResponse.json(
        { success: false, error: 'Failed to reserve credits' },
        { status: 500 }
      )
    }

    const rpc = rpcData as DeductRpcResponse
    if (!rpc.success) {
      const msg = rpc.message ?? 'Credit deduction failed'
      const isInsufficient = msg === 'Insufficient credits'
      return NextResponse.json(
        {
          success: false,
          error: msg,
          ...(rpc.required !== undefined ? { required: rpc.required } : {}),
          ...(rpc.available !== undefined ? { available: rpc.available } : {}),
        },
        { status: isInsufficient ? 402 : 400 }
      )
    }

    const videoId = rpc.video_id
    if (!videoId) {
      console.error('RPC reported success but returned no video_id:', rpc)
      return NextResponse.json(
        { success: false, error: 'Internal error: no video id returned' },
        { status: 500 }
      )
    }

    // ---- 4. Submit to KIE ----
    const kie = new KIEVideoService()
    let taskId: string
    try {
      taskId = await kie.createSeedanceTask({
        prompt: finalPrompt,
        referenceImageUrls,
        duration: DURATION_SECONDS,
        resolution: RESOLUTION,
        aspectRatio,
        generateAudio: effect.generateAudio,
        nsfwChecker: true,
      })
    } catch (kieError) {
      console.error('KIE submit failed, refunding credits:', kieError)

      await serviceSupabase
        .from('videos')
        .update({
          status: 'failed',
          error_message: `KIE submit failed: ${kieError instanceof Error ? kieError.message : 'Unknown error'}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoId)

      await serviceSupabase.from('credit_transactions').insert([
        {
          user_id: user.id,
          amount: CREDIT_COST,
          transaction_type: 'refund',
          description: `Refund for KIE submission failure on video ${videoId}`,
          video_id: videoId,
        },
      ])

      return NextResponse.json(
        {
          success: false,
          error: `Video provider error: ${kieError instanceof Error ? kieError.message : 'Unknown error'}`,
        },
        { status: 502 }
      )
    }

    // ---- 5. Record taskId on videos row, flip pending → processing ----
    const { error: updateError } = await serviceSupabase
      .from('videos')
      .update({
        external_task_id: taskId,
        status: 'processing',
      })
      .eq('id', videoId)

    if (updateError) {
      // KIE task is live but we can't link it to the videos row.
      // The webhook callback will then fail to find a row by external_task_id
      // and be ignored. We've already charged the user — best to mark failed
      // and refund here, before the callback fires.
      console.error(
        'Failed to write external_task_id, refunding and marking failed:',
        updateError
      )
      await serviceSupabase
        .from('videos')
        .update({
          status: 'failed',
          error_message: `Failed to link KIE task ${taskId}: ${updateError.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', videoId)

      await serviceSupabase.from('credit_transactions').insert([
        {
          user_id: user.id,
          amount: CREDIT_COST,
          transaction_type: 'refund',
          description: `Refund for task-link failure on video ${videoId}`,
          video_id: videoId,
        },
      ])

      return NextResponse.json(
        { success: false, error: 'Failed to record task. Credits refunded.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        taskId,
        creditsDeducted: CREDIT_COST,
      },
    })
  } catch (error) {
    console.error('video/generate error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
