import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'
import {
  KIESoundService,
  GAME_AUDIO_MODES,
  SOUND_KEYS,
  buildGameSoundPrompt,
} from '../src/lib/kie-api/kie-sound-service'

const state: {
  insufficient: boolean
  soundCallArgs?: Record<string, unknown>
  savedMetadata?: Record<string, unknown>
  creditTransactions: Record<string, unknown>[]
} = {
  insufficient: false,
  creditTransactions: [],
}

const loader = Module as unknown as {
  _load: (name: string, ...args: unknown[]) => unknown
}
const original = loader._load
loader._load = function (name, ...args) {
  if (name === '@/lib/supabase-server') {
    return {
      createAuthenticatedClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user-sound-1' } },
            error: null,
          }),
        },
      }),
      createServiceClient: () => ({
        from: (table: string) => {
          if (table === 'user_profiles') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({
                    data: { credits: state.insufficient ? 3 : 20 },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'credit_transactions') {
            return {
              insert: async (rows: Record<string, unknown>[]) => {
                state.creditTransactions.push(...rows)
                return { error: null }
              },
            }
          }
          return {}
        },
      }),
    }
  }
  if (name === '@/lib/moderation') {
    return {
      screenPrompt: async () => ({ allowed: true, decision: 'allow' }),
    }
  }
  if (name === '@/lib/rate-limiter') {
    return {
      imageLimiter: {
        isAllowed: () => true,
        getTimeUntilReset: () => 0,
        getRemainingRequests: () => 10,
      },
    }
  }
  if (name === '@/lib/cloudflare-kv') {
    return {
      saveKIETaskMetadataKV: async (meta: Record<string, unknown>) => {
        state.savedMetadata = meta
      },
    }
  }
  if (name === '@/lib/kie-api/kie-sound-service') {
    return {
      GAME_AUDIO_MODES,
      SOUND_KEYS,
      KIESoundService: class {
        async createSoundTask(options: Record<string, unknown>) {
          state.soundCallArgs = options
          return {
            taskId: 'task-sound-123',
            effectivePrompt: buildGameSoundPrompt(
              String(options.prompt || ''),
              (options.mode as 'sound-effects') || 'sound-effects',
              (options.durationHint as 'auto') || 'auto'
            ),
          }
        }
      },
    }
  }
  return original.call(this, name, ...args)
}

process.env.KIE_API_TOKEN = process.env.KIE_API_TOKEN || 'test-kie-token'
const { POST } = require('../src/app/api/sound/generate/route') as typeof import('../src/app/api/sound/generate/route')

function buildRequest(body: Record<string, unknown>, authenticated = true) {
  return new NextRequest('https://example.invalid/api/sound/generate', {
    method: 'POST',
    headers: authenticated ? { Authorization: 'Bearer test-jwt' } : {},
    body: JSON.stringify(body),
  })
}

async function testKIESoundServicePayloadAndExtraction() {
  const bodies: Record<string, unknown>[] = []
  const origFetch = globalThis.fetch
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'success',
        data: { taskId: 'task-sound-live-1' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  try {
    const svc = new KIESoundService({ apiToken: 'tok' })
    const res = await svc.createSoundTask({
      prompt: 'Cozy medieval village square theme',
      mode: 'music',
      durationHint: 'auto',
      soundLoop: true,
      soundTempo: 96,
      soundKey: 'Am',
    })
    assert.equal(res.taskId, 'task-sound-live-1')
    assert.equal(bodies.length, 1)
    assert.equal(bodies[0].model, 'ai-music-api/sounds')
    const input = bodies[0].input as Record<string, unknown>
    assert.equal(input.model, 'V6')
    assert.equal(input.sound_loop, true)
    assert.equal(input.sound_tempo, 96)
    assert.equal(input.sound_key, 'Am')
    assert.equal(input.grab_lyrics, false)
    assert.equal('duration' in input, false, 'KIE sounds input must not contain duration')
  } finally {
    globalThis.fetch = origFetch
  }

  // Test clip extraction from KIE recordInfo response
  const clips = KIESoundService.extractClips({
    taskId: 'task-abc',
    model: 'ai-music-api/sounds',
    state: 'success',
    response: {
      code: 200,
      data: [
        {
          id: 'clip-1',
          audio_url: 'https://tempfile.aiquickdraw.com/r/clip-1.mp3',
          stream_audio_url: 'https://audiostream.kie.ai/stream/clip-1.mp3',
          duration: 20.8,
          title: 'RPG Town',
        },
      ],
    },
  })
  assert.equal(clips.length, 1)
  assert.equal(clips[0].id, 'clip-1')
  assert.equal(clips[0].audioUrl, 'https://tempfile.aiquickdraw.com/r/clip-1.mp3')
  assert.equal(clips[0].duration, 20.8)
}

async function testSoundGenerateRoute() {
  state.insufficient = false
  state.creditTransactions = []
  state.soundCallArgs = undefined
  state.savedMetadata = undefined

  const res = await POST(
    buildRequest({
      prompt: 'Arcane sword slash with thunder impact',
      mode: 'sound-effects',
      durationHint: '5',
      soundLoop: false,
      soundTempo: 128,
      soundKey: 'Em',
    })
  )
  assert.equal(res.status, 200)
  const json = await res.json()
  assert.equal(json.success, true)
  assert.equal(json.taskId, 'task-sound-123')
  assert.equal(json.creditsUsed, 5)
  assert.equal(json.creditsRemaining, 15)
  const callArgs = state.soundCallArgs as Record<string, unknown> | undefined
  assert.equal(callArgs?.mode, 'sound-effects')
  assert.equal(callArgs?.soundTempo, 128)
  assert.equal(state.creditTransactions.length, 1)
  assert.equal(state.creditTransactions[0].amount, -5)

  // Insufficient credits -> 402
  state.insufficient = true
  const res402 = await POST(
    buildRequest({
      prompt: 'Dungeon ambiance loop',
      mode: 'ambiance-loops',
    })
  )
  assert.equal(res402.status, 402)
}

async function main() {
  await testKIESoundServicePayloadAndExtraction()
  await testSoundGenerateRoute()
  console.log('✅ All game-sound-generation tests passed!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
