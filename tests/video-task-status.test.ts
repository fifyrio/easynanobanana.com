import assert from 'node:assert/strict'
import Module from 'node:module'
import { NextRequest } from 'next/server'

// Stub database/auth at the module boundary: never contact a live account.
let row: { user_id: string; status: string; video_url: string } | null = {
  user_id: 'owner', status: 'completed', video_url: 'https://example.invalid/result.mp4',
}
let queryColumn = ''
let queryTaskId = ''
const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown }
const originalLoad = loader._load
loader._load = function (name, ...args) {
  if (name === '@/lib/supabase-server') {
    return {
      createAuthenticatedClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) } }),
      createServiceClient: () => ({
        from: () => ({ select: () => ({ eq: (column: string, taskId: string) => {
          queryColumn = column
          queryTaskId = taskId
          return { maybeSingle: async () => column === 'external_task_id'
            ? { data: row, error: null }
            : { data: null, error: { message: 'Column does not exist in videos schema' } } }
        } }) }),
      }),
    }
  }
  return originalLoad.call(this, name, ...args)
}
const { GET } = require('../src/app/api/video/task-status/route') as typeof import('../src/app/api/video/task-status/route')
loader._load = originalLoad

function request(taskId = 'provider-task', authenticated = true) {
  return new NextRequest(`https://example.invalid/api/video/task-status?taskId=${taskId}`, {
    headers: authenticated ? { Authorization: 'Bearer test-token' } : {},
  })
}

async function main() {
  const completed = await GET(request())
  assert.equal(completed.status, 200, 'A generated task must be found using its stored external ID')
  assert.equal(queryColumn, 'external_task_id')
  assert.equal(queryTaskId, 'provider-task')
  assert.equal((await completed.json()).data.videoUrl, 'https://example.invalid/result.mp4')

  row = { user_id: 'another-user', status: 'completed', video_url: 'https://example.invalid/private.mp4' }
  assert.equal((await GET(request())).status, 403, 'Never expose another user’s video')
  row = null
  assert.equal((await GET(request())).status, 404)
  assert.equal((await GET(request('', true))).status, 400)
  assert.equal((await GET(request('provider-task', false))).status, 401)
  console.log('PASS: completed task lookup, ownership, missing task and authentication')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
