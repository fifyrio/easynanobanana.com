import { NextRequest, NextResponse } from 'next/server'
import {
  getKIETaskMetadataKV,
  updateKIETaskMetadataKV,
} from '@/lib/cloudflare-kv'
import {
  KIESoundService,
  type NormalizedSoundClip,
} from '@/lib/kie-api/kie-sound-service'
import { uploadBufferToR2, getPublicUrl } from '@/lib/r2'
import { createServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sound/task-status?taskId=xxx
 *
 * Polls KIE recordInfo for a game sound task, archives completed MP3 clips to
 * Cloudflare R2, and returns normalized clip metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId parameter required' },
        { status: 400 }
      )
    }

    const metadata = await getKIETaskMetadataKV(taskId)

    // If KV already has completed clips, return immediately
    if (metadata?.status === 'completed' && metadata.resultUrls?.length) {
      const savedClips =
        (metadata.metadata?.clips as NormalizedSoundClip[] | undefined) ??
        metadata.resultUrls.map((url, idx) => ({
          id: `${taskId}-${idx + 1}`,
          audioUrl: url,
        }))

      return NextResponse.json(
        {
          taskId,
          status: 'completed',
          prompt: metadata.prompt,
          resultUrls: metadata.resultUrls,
          clips: savedClips,
          metadata: metadata.metadata,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }

    if (metadata?.status === 'failed') {
      return NextResponse.json(
        {
          taskId,
          status: 'failed',
          prompt: metadata.prompt,
          error: metadata.error || 'Sound generation task failed',
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }

    // Query KIE upstream
    const soundService = new KIESoundService()
    const upstream = await soundService.getTaskStatus(taskId)

    if (upstream.state === 'success' && upstream.clips.length > 0) {
      const uploadedClips: NormalizedSoundClip[] = []
      const resultUrls: string[] = []

      for (let i = 0; i < upstream.clips.length; i++) {
        const clip = upstream.clips[i]
        let finalAudioUrl = clip.audioUrl

        try {
          const audioRes = await fetch(clip.audioUrl)
          if (audioRes.ok) {
            const buffer = Buffer.from(await audioRes.arrayBuffer())
            const key = `sounds/kie-sound-${taskId}-${i + 1}.mp3`
            await uploadBufferToR2({
              key,
              body: buffer,
              contentType: 'audio/mpeg',
              metadata: {
                taskId,
                clipId: clip.id,
              },
            })
            finalAudioUrl = getPublicUrl(key)
          }
        } catch (uploadErr) {
          console.warn(
            `⚠️ Failed to mirror clip ${clip.id} to R2, falling back to upstream URL:`,
            uploadErr
          )
        }

        resultUrls.push(finalAudioUrl)
        uploadedClips.push({
          ...clip,
          audioUrl: finalAudioUrl,
        })
      }

      if (metadata) {
        await updateKIETaskMetadataKV(taskId, {
          status: 'completed',
          resultUrls,
          consumeCredits: upstream.creditsConsumed,
          costTime: upstream.costTime,
          metadata: {
            ...(metadata.metadata ?? {}),
            clips: uploadedClips,
          },
        })
      }

      return NextResponse.json(
        {
          taskId,
          status: 'completed',
          prompt: metadata?.prompt,
          resultUrls,
          clips: uploadedClips,
          metadata: metadata?.metadata,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }

    if (upstream.state === 'fail' || upstream.state === 'failed') {
      const errorMsg =
        upstream.failMsg || 'KIE game sound generation failed'

      // Refund credits once if KV metadata records a userId and wasn't refunded yet
      if (
        metadata?.userId &&
        !metadata.metadata?.creditsRefunded
      ) {
        const refundAmount =
          typeof metadata.metadata?.creditsDeducted === 'number'
            ? (metadata.metadata.creditsDeducted as number)
            : 5
        try {
          const serviceSupabase = createServiceClient()
          await serviceSupabase.from('credit_transactions').insert([
            {
              user_id: metadata.userId,
              amount: refundAmount,
              transaction_type: 'refund',
              description: `Refund for failed game sound generation (${taskId})`,
              image_id: null,
            },
          ])
        } catch (refundErr) {
          console.error('⚠️ Failed to refund sound credits:', refundErr)
        }
      }

      if (metadata) {
        await updateKIETaskMetadataKV(taskId, {
          status: 'failed',
          error: errorMsg,
          metadata: {
            ...(metadata.metadata ?? {}),
            creditsRefunded: true,
          },
        })
      }

      return NextResponse.json(
        {
          taskId,
          status: 'failed',
          prompt: metadata?.prompt,
          error: errorMsg,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }

    return NextResponse.json(
      {
        taskId,
        status: 'processing',
        upstreamState: upstream.state,
        prompt: metadata?.prompt,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Sound task-status query error:', msg)
    return NextResponse.json(
      {
        error: 'Failed to query sound task status',
        message: msg,
      },
      { status: 500 }
    )
  }
}
