import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'
import { KIEImageService, FLUX_KLEIN_ASPECT_RATIOS } from '../src/lib/kie-api/kie-image-service'

const state: {
  insufficient: boolean
  fluxCallArgs?: Record<string, unknown>
  nanoCallArgs?: { prompt: string; imageRatio: string; model: string }
  savedMetadata?: Record<string, unknown>
  creditTransactions: Record<string, unknown>[]
} = {
  insufficient: false,
  creditTransactions: [],
}

const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown }
const original = loader._load
loader._load = function (name, ...args) {
  if (name === '@/lib/supabase-server') {
    return {
      createAuthenticatedClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'user-flux-1' } }, error: null }),
        },
      }),
      createServiceClient: () => ({
        from: (table: string) => {
          if (table === 'user_profiles') {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({
                    data: { credits: state.insufficient ? 2 : 25 },
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
  if (name === '@/lib/kie-api/kie-image-service') {
    return {
      FLUX_KLEIN_ASPECT_RATIOS,
      KIEImageService: class {
        async createFluxKleinTask(options: Record<string, unknown>) {
          state.fluxCallArgs = options
          return 'task-flux-klein-123'
        }
        async createPromptOnlyTask(prompt: string, imageRatio: string, model: string) {
          state.nanoCallArgs = { prompt, imageRatio, model }
          return 'task-nano-123'
        }
        async createTask(prompt: string, _urls: string[], imageRatio: string, model: string) {
          state.nanoCallArgs = { prompt, imageRatio, model }
          return 'task-nano-edit-123'
        }
      },
    }
  }
  return original.call(this, name, ...args)
}

process.env.KIE_API_TOKEN = process.env.KIE_API_TOKEN || 'test-kie-token'
const { POST } = require('../src/app/api/generate-image/route') as typeof import('../src/app/api/generate-image/route')

function buildRequest(body: Record<string, unknown>, authenticated = true) {
  return new NextRequest('https://example.invalid/api/generate-image', {
    method: 'POST',
    headers: authenticated ? { Authorization: 'Bearer test-jwt' } : {},
    body: JSON.stringify(body),
  })
}

async function testKIEImageServicePayloadShapes() {
  const bodies: Record<string, unknown>[] = []
  const origFetch = globalThis.fetch
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)))
    return new Response(
      JSON.stringify({ code: 200, msg: 'success', data: { taskId: `task-${bodies.length}` } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }) as typeof fetch

  try {
    const svc = new KIEImageService({ apiToken: 'tok', callbackUrl: 'https://example.invalid/cb' })
    // 1. Text-to-image with 'auto' aspectRatio should fall back to '1:1'
    const t2iId = await svc.createFluxKleinTask({
      prompt: 'A cozy wooden bookshop in autumn rain',
      aspectRatio: 'auto',
      enhancePrompt: true,
    })
    assert.equal(t2iId, 'task-1')
    assert.equal(bodies[0].model, 'flux-3/klein-text-to-image')
    const t2iInput = bodies[0].input as Record<string, unknown>
    assert.equal(t2iInput.aspect_ratio, '1:1')
    assert.equal(t2iInput.resolution, '1K')
    assert.equal(t2iInput.enhance_prompt, true)
    assert.equal('image_urls' in t2iInput, false)

    // 2. Edit-image with reference URLs keeps 'auto' and sends image_urls
    const editId = await svc.createFluxKleinTask({
      prompt: 'Change the coat color to emerald green',
      imageUrls: ['https://example.invalid/ref1.jpg'],
      aspectRatio: 'auto',
      enhancePrompt: false,
    })
    assert.equal(editId, 'task-2')
    assert.equal(bodies[1].model, 'flux-3/klein-edit-image')
    const editInput = bodies[1].input as Record<string, unknown>
    assert.equal(editInput.aspect_ratio, 'auto')
    assert.deepEqual(editInput.image_urls, ['https://example.invalid/ref1.jpg'])
    assert.equal(editInput.enhance_prompt, false)
  } finally {
    globalThis.fetch = origFetch
  }
}

async function main() {
  await testKIEImageServicePayloadShapes()

  // Route test 1: flux-3-klein text-to-image
  state.creditTransactions = []
  const res1 = await POST(
    buildRequest({
      prompt: 'Editorial coffee bottle product shot',
      modelFamily: 'flux-3-klein',
      aspectRatio: '4:3',
      enhancePrompt: true,
    })
  )
  assert.equal(res1.status, 200)
  const json1 = await res1.json()
  assert.equal(json1.taskId, 'task-flux-klein-123')
  assert.equal(json1.creditsUsed, 5)
  assert.equal(state.fluxCallArgs?.aspectRatio, '4:3')
  assert.equal(state.fluxCallArgs?.enhancePrompt, true)
  assert.equal((state.savedMetadata?.metadata as Record<string, unknown>)?.modelFamily, 'flux-3-klein')
  assert.equal(state.creditTransactions.length, 1)
  assert.equal(state.creditTransactions[0].amount, -5)

  // Route test 2: flux-3-klein image editing
  const res2 = await POST(
    buildRequest({
      prompt: 'Replace the mug with a glass teapot',
      imageUrls: ['https://example.invalid/source.jpg'],
      modelFamily: 'flux-3-klein',
      aspectRatio: 'auto',
      enhancePrompt: false,
    })
  )
  assert.equal(res2.status, 200)
  assert.deepEqual(state.fluxCallArgs?.imageUrls, ['https://example.invalid/source.jpg'])
  assert.equal(state.fluxCallArgs?.aspectRatio, 'auto')
  assert.equal(state.fluxCallArgs?.enhancePrompt, false)
  assert.equal(state.savedMetadata?.imageType, 'edit')

  // Route test 3: invalid modelFamily rejected with 400 before billing
  state.creditTransactions = []
  const resInvalid = await POST(buildRequest({ prompt: 'Test', modelFamily: 'unknown-model' }))
  assert.equal(resInvalid.status, 400)
  assert.equal(state.creditTransactions.length, 0)

  // Route test 4: default modelFamily still routes to nano-banana
  const resDefault = await POST(buildRequest({ prompt: 'Default nano test', aspectRatio: '9:16' }))
  assert.equal(resDefault.status, 200)
  assert.equal(state.nanoCallArgs?.model, 'google/nano-banana')

  // Route test 5: insufficient credits returns 402 without calling provider
  state.insufficient = true
  state.fluxCallArgs = undefined
  const res402 = await POST(buildRequest({ prompt: 'No credits', modelFamily: 'flux-3-klein' }))
  assert.equal(res402.status, 402)
  assert.equal(state.fluxCallArgs, undefined)

  console.log('PASS: FLUX 3 Image Klein service payloads, route dispatch, 5-credit billing, and validation')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => {
    loader._load = original
  })
