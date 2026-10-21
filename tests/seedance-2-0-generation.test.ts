import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'
import { KIEVideoService } from '../src/lib/kie-api/kie-video-service'

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
              : { success: true, video_id: 'video-seedance-2-0' },
            error: null,
          }
        },
        from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
      }),
    }
  }
  if (name === '@/lib/kie-api/kie-video-service') {
    return {
      KIEVideoService: class {
        async createSeedanceTask(input: Record<string, unknown>) {
          providerInput = input
          return 'seedance-2-mini-task-123'
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
      effectType: 'ai-seedance-2-0',
      presetId: 'cinematic-portrait-motion',
      sourceImageUrl: 'https://example.invalid/input.jpg',
      referenceImageUrls: ['https://example.invalid/input.jpg'],
      aspectRatio: '16:9',
      customText: 'Soft golden hour sunlight and warm smile',
      ...overrides,
    }),
  })
}

async function testKIEVideoServiceModelSelection() {
  const bodies: Record<string, unknown>[] = []
  const origFetch = globalThis.fetch
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return new Response(
      JSON.stringify({ code: 200, msg: 'success', data: { taskId: `vtask-${bodies.length}` } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  try {
    const svc = new KIEVideoService({ apiToken: 'tok', callbackUrl: 'https://example.invalid/vcb' })
    await svc.createSeedanceTask({
      prompt: 'Mini test',
      model: 'bytedance/seedance-2-mini',
      duration: 4,
      resolution: '480p',
      aspectRatio: '9:16',
    })
    assert.equal(bodies[0].model, 'bytedance/seedance-2-mini')

    await svc.createSeedanceTask({
      prompt: 'Default fast test',
      duration: 4,
      resolution: '480p',
      aspectRatio: '9:16',
    })
    assert.equal(bodies[1].model, 'bytedance/seedance-2-fast')
  } finally {
    globalThis.fetch = origFetch
  }
}

async function main() {
  await testKIEVideoServiceModelSelection()

  const response = await POST(request())
  assert.equal(response.status, 200, 'Seedance 2.0 effect must submit through the video pipeline')
  assert.equal((await response.json()).data.taskId, 'seedance-2-mini-task-123')
  assert.equal(calls[0].args.p_effect_type, 'ai-seedance-2-0')
  assert.equal(calls[0].args.credits_to_deduct, 100)
  assert.equal(calls[0].args.p_aspect_ratio, '16:9')
  assert.equal(providerInput?.model, 'bytedance/seedance-2-mini')
  assert.equal(providerInput?.duration, 4)
  assert.equal(providerInput?.resolution, '480p')
  assert.equal(providerInput?.aspectRatio, '16:9')
  assert.equal(providerInput?.generateAudio, true)
  assert.match(String(providerInput?.prompt), /Additional user details: Soft golden hour sunlight/)

  calls = []
  assert.equal((await POST(request({ presetId: 'missing' }))).status, 400)
  assert.equal((await POST(request({}, false))).status, 401)
  assert.equal(calls.length, 0, 'Reject invalid requests before reserving credits')

  insufficient = true
  providerInput = undefined
  assert.equal((await POST(request())).status, 402)
  assert.equal(providerInput, undefined)
  console.log('PASS: Seedance 2.0 Mini dispatch, customText, aspectRatio, pricing, audio and insufficient credits')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
