import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'
import { AISpliceVideoService } from '../src/lib/aisplice-api/aisplice-video-service'

let insufficient = false
let calls: { name: string; args: Record<string, unknown> }[] = []
let providerInput: Record<string, unknown> | undefined

const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown }
const original = loader._load
loader._load = function (name, ...args) {
  if (name === '@/lib/supabase-server') {
    return {
      createAuthenticatedClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
      }),
      createServiceClient: () => ({
        rpc: async (name: string, args: Record<string, unknown>) => {
          calls.push({ name, args })
          return {
            data: insufficient
              ? { success: false, message: 'Insufficient credits', required: 100, available: 0 }
              : { success: true, video_id: 'video-seedance-2-5' },
            error: null,
          }
        },
        from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
      }),
    }
  }
  if (name === '@/lib/aisplice-api/aisplice-video-service') {
    return {
      AISpliceVideoService: class {
        async createVideoTask(input: Record<string, unknown>) {
          providerInput = input
          return 'aisplice-seedance-2-5-task-123'
        }
      },
    }
  }
  return original.call(this, name, ...args)
}

const { POST } = require('../src/app/api/video/generate/route') as typeof import('../src/app/api/video/generate/route')
loader._load = original

function request(overrides: Record<string, unknown> = {}, authenticated = true) {
  return new NextRequest('https://example.invalid/api/video/generate', {
    method: 'POST',
    headers: authenticated ? { Authorization: 'Bearer test-token' } : {},
    body: JSON.stringify({
      effectType: 'ai-seedance-2-5',
      presetId: 'dynamic-hero-orbit',
      sourceImageUrl: 'https://example.invalid/input.jpg',
      referenceImageUrls: ['https://example.invalid/input.jpg'],
      aspectRatio: '16:9',
      customText: 'Add subtle lens flare at golden hour',
      ...overrides,
    }),
  })
}

async function testAISpliceVideoServicePayloads() {
  const bodies: Record<string, unknown>[] = []
  const origFetch = globalThis.fetch
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return new Response(
      JSON.stringify({ task_id: `aisplice-task-${bodies.length}`, status: 'queued' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  try {
    const svc = new AISpliceVideoService({
      apiKey: 'sk-test',
      baseUrl: 'https://www.aisplice.store',
      webhookUrl: 'https://example.invalid/api/video/callback',
    })
    const taskId = await svc.createVideoTask({
      prompt: 'Seedance 2.5 orbit test',
      model: 'doubao-seedance-2.5',
      referenceImageUrls: ['https://example.invalid/hero.jpg'],
      duration: 4,
      resolution: '480p',
      aspectRatio: '9:16',
      generateAudio: true,
      nsfwCheck: true,
    })
    assert.equal(taskId, 'aisplice-task-1')
    assert.equal(bodies[0].model, 'doubao-seedance-2.5')
    assert.equal(bodies[0].duration, 4)
    assert.equal(bodies[0].resolution, '480p')
    assert.equal(bodies[0].size, '9:16')
    assert.equal(bodies[0].nsfw_check, true)
    assert.deepEqual(bodies[0].images, ['https://example.invalid/hero.jpg'])
    assert.equal((bodies[0].metadata as Record<string, unknown>).generate_audio, true)
    assert.equal(bodies[0].webhook_url, 'https://example.invalid/api/video/callback')

    const normSuccess = AISpliceVideoService.normalizeTaskStatus('t1', {
      task_id: 't1',
      status: 'completed',
      metadata: { url: 'https://cdn.aisplice.store/v/t1.mp4' },
    })
    assert.equal(normSuccess.state, 'success')
    assert.equal(normSuccess.videoUrl, 'https://cdn.aisplice.store/v/t1.mp4')

    const normFail = AISpliceVideoService.normalizeTaskStatus('t2', {
      task_id: 't2',
      status: 'failed',
      fail_reason: 'Content policy violation',
    })
    assert.equal(normFail.state, 'fail')
    assert.equal(normFail.error, 'Content policy violation')
  } finally {
    globalThis.fetch = origFetch
  }
}

async function main() {
  await testAISpliceVideoServicePayloads()

  const response = await POST(request())
  assert.equal(response.status, 200, 'Seedance 2.5 effect must submit through the AISplice video pipeline')
  assert.equal((await response.json()).data.taskId, 'aisplice-seedance-2-5-task-123')
  assert.equal(calls[0].args.p_effect_type, 'ai-seedance-2-5')
  assert.equal(calls[0].args.credits_to_deduct, 100)
  assert.equal(calls[0].args.p_aspect_ratio, '16:9')
  assert.equal(providerInput?.model, 'doubao-seedance-2.5')
  assert.equal(providerInput?.duration, 4)
  assert.equal(providerInput?.resolution, '480p')
  assert.equal(providerInput?.aspectRatio, '16:9')
  assert.equal(providerInput?.generateAudio, true)
  assert.match(String(providerInput?.prompt), /Additional user details: Add subtle lens flare at golden hour/)

  calls = []
  assert.equal((await POST(request({ presetId: 'missing' }))).status, 400)
  assert.equal((await POST(request({}, false))).status, 401)
  assert.equal(calls.length, 0, 'Reject invalid requests before reserving credits')

  insufficient = true
  providerInput = undefined
  assert.equal((await POST(request())).status, 402)
  assert.equal(providerInput, undefined)
  console.log('PASS: Seedance 2.5 AISplice dispatch (doubao-seedance-2.5), customText, aspectRatio, pricing, audio and insufficient credits')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
