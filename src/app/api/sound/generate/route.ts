import { NextRequest, NextResponse } from 'next/server'
import {
  createAuthenticatedClient,
  createServiceClient,
} from '@/lib/supabase-server'
import { saveKIETaskMetadataKV } from '@/lib/cloudflare-kv'
import { imageLimiter } from '@/lib/rate-limiter'
import { screenPrompt } from '@/lib/moderation'
import {
  KIESoundService,
  GAME_AUDIO_MODES,
  SOUND_KEYS,
  type GameAudioMode,
  type DurationHint,
  type SoundKey,
} from '@/lib/kie-api/kie-sound-service'

const CREDITS_REQUIRED = 5
const ALLOWED_DURATION_HINTS: readonly DurationHint[] = ['auto', '5', '10']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      mode = 'sound-effects',
      durationHint = 'auto',
      soundLoop = false,
      soundTempo,
      soundKey = 'Any',
    } = body ?? {}

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (prompt.trim().length > 500) {
      return NextResponse.json(
        { error: 'Prompt must be 500 characters or fewer' },
        { status: 400 }
      )
    }

    const validMode: GameAudioMode = GAME_AUDIO_MODES.includes(
      mode as GameAudioMode
    )
      ? (mode as GameAudioMode)
      : 'sound-effects'

    const validDurationHint: DurationHint = ALLOWED_DURATION_HINTS.includes(
      String(durationHint) as DurationHint
    )
      ? (String(durationHint) as DurationHint)
      : 'auto'

    const validSoundKey: SoundKey = SOUND_KEYS.includes(soundKey as SoundKey)
      ? (soundKey as SoundKey)
      : 'Any'

    const parsedTempo =
      soundTempo !== undefined && soundTempo !== null && soundTempo !== ''
        ? Number(soundTempo)
        : undefined

    if (
      parsedTempo !== undefined &&
      (!Number.isFinite(parsedTempo) || parsedTempo < 1 || parsedTempo > 300)
    ) {
      return NextResponse.json(
        { error: 'Tempo (BPM) must be between 1 and 300' },
        { status: 400 }
      )
    }

    // Authenticate Bearer token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Content moderation
    const moderation = await screenPrompt(prompt.trim(), `user_${user.id}`)
    if (!moderation.allowed) {
      if (moderation.decision === 'error') {
        return NextResponse.json(
          {
            error: 'moderation_unavailable',
            message:
              'Unable to verify your prompt right now. Please try again shortly.',
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        {
          error: 'prompt_rejected',
          message:
            'Your prompt was rejected because it violates our content policy. Please revise and try again.',
        },
        { status: 400 }
      )
    }

    // Rate limiting
    if (!imageLimiter.isAllowed(user.id)) {
      const timeUntilReset = imageLimiter.getTimeUntilReset(user.id)
      const remainingRequests = imageLimiter.getRemainingRequests(user.id)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          timeUntilResetMs: timeUntilReset,
          remainingRequests,
          message: `Too many requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
        },
        { status: 429 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            'User profile not found. Please complete your profile setup first.',
        },
        { status: 404 }
      )
    }

    if (profile.credits < CREDITS_REQUIRED) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDITS_REQUIRED,
          available: profile.credits,
        },
        { status: 402 }
      )
    }

    if (!process.env.KIE_API_TOKEN && !process.env.KIE_API_KEY) {
      return NextResponse.json(
        { error: 'KIE_API_TOKEN not configured' },
        { status: 500 }
      )
    }

    const soundService = new KIESoundService()
    let taskId: string
    let effectivePrompt: string

    try {
      const created = await soundService.createSoundTask({
        prompt: prompt.trim(),
        mode: validMode,
        durationHint: validDurationHint,
        soundLoop: Boolean(soundLoop),
        soundTempo: parsedTempo,
        soundKey: validSoundKey,
        modelVersion: 'V6',
      })
      taskId = created.taskId
      effectivePrompt = created.effectivePrompt
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Failed to create KIE sound task:', msg)
      return NextResponse.json(
        {
          error: 'Failed to create game sound generation task',
          message: msg,
        },
        { status: 500 }
      )
    }

    // Save task metadata to Cloudflare KV
    try {
      await saveKIETaskMetadataKV({
        taskId,
        status: 'pending',
        prompt: prompt.trim(),
        imageUrl: '',
        userId: user.id,
        imageType: 'generation',
        metadata: {
          taskKind: 'sound',
          mode: validMode,
          durationHint: validDurationHint,
          soundLoop: Boolean(soundLoop),
          soundTempo: parsedTempo ?? null,
          soundKey: validSoundKey,
          effectivePrompt,
          creditsDeducted: CREDITS_REQUIRED,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (kvErr) {
      console.error('⚠️ Failed to save sound task metadata to KV:', kvErr)
    }

    // Deduct 5 credits
    const { error: transactionError } = await serviceSupabase
      .from('credit_transactions')
      .insert([
        {
          user_id: user.id,
          amount: -CREDITS_REQUIRED,
          transaction_type: 'usage',
          description: `AI game sound generation (${validMode})`,
          image_id: null,
        },
      ])

    if (transactionError) {
      console.error(
        'Failed to create credit transaction for game sound:',
        transactionError
      )
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: 'pending',
      mode: validMode,
      soundLoop: Boolean(soundLoop),
      creditsUsed: CREDITS_REQUIRED,
      creditsRemaining: profile.credits - CREDITS_REQUIRED,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Game sound generation error:', msg)
    return NextResponse.json(
      { error: `Game sound generation failed: ${msg}` },
      { status: 500 }
    )
  }
}
