import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'

let insufficient = false
let calls: { name: string; args: Record<string, unknown> }[] = []
let providerInput: Record<string, unknown> | undefined
const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown }
const original = loader._load
loader._load = function (name, ...args) {
  if (name === '@/lib/supabase-server') return {
    createAuthenticatedClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }),
    createServiceClient: () => ({
      rpc: async (name: string, args: Record<string, unknown>) => {
        calls.push({ name, args })
        return { data: insufficient ? { success: false, message: 'Insufficient credits', required: 100, available: 0 } : { success: true, video_id: 'video' }, error: null }
      },
      from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
    }),
  }
  if (name === '@/lib/kie-api/kie-video-service') return {
    KIEVideoService: class {
      async createSeedanceTask(input: Record<string, unknown>) {
        providerInput = input
        return 'provider-task'
      }
    },
  }
  return original.call(this, name, ...args)
}
const { POST } = require('../src/app/api/video/generate/route') as typeof import('../src/app/api/video/generate/route')
loader._load = original

function request(overrides: Record<string, unknown> = {}, authenticated = true) {
  return new NextRequest('https://example.invalid/api/video/generate', {
    method: 'POST', headers: authenticated ? { Authorization: 'Bearer test-token' } : {},
    body: JSON.stringify({ effectType: 'ai-rumpelstiltskin', presetId: 'tiptoe-dance', sourceImageUrl: 'https://example.invalid/input.jpg', referenceImageUrls: ['https://example.invalid/input.jpg'], ...overrides }),
  })
}

async function main() {
  const response = await POST(request())
  assert.equal(response.status, 200, 'The new effect must submit through the existing video pipeline')
  assert.equal((await response.json()).data.taskId, 'provider-task')
  assert.equal(calls[0].args.p_effect_type, 'ai-rumpelstiltskin')
  assert.equal(calls[0].args.credits_to_deduct, 100)
  assert.equal(providerInput?.duration, 4)
  assert.equal(providerInput?.resolution, '480p')
  assert.equal(providerInput?.generateAudio, false)
  assert.match(String(providerInput?.prompt), /heels visibly raised/)

  calls = []
  assert.equal((await POST(request({ presetId: 'missing' }))).status, 400)
  assert.equal((await POST(request({ effectType: 'bulin-47-validation' }))).status, 400, 'The validation candidate is not a public effect')
  assert.equal((await POST(request({}, false))).status, 401)
  assert.equal(calls.length, 0, 'Reject invalid requests before reserving credits')

  insufficient = true
  providerInput = undefined
  assert.equal((await POST(request())).status, 402)
  assert.equal(providerInput, undefined)
  console.log('PASS: Rumpelstiltskin dispatch, preset/auth validation, pricing, silence and insufficient credits')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
