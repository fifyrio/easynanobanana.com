/**
 * AISplice Video Generation Service (`https://www.aisplice.store/v1/videos`)
 *
 * Implements OpenAI-compatible async video generation for Doubao Seedance 2.5
 * (`doubao-seedance-2.5`) and related models per `/manual/tasks/videos`.
 *
 * Lifecycle:
 *   1. Submit:  POST /v1/videos -> { task_id: "task_xxx", status: "queued" }
 *   2. Poll:    GET  /v1/videos/{task_id} -> { task_id, status: "queued" | "in_progress" | "completed" | "failed" | "unknown", url?, metadata?: { url? }, fail_reason? }
 *   3. Content: GET  /v1/videos/{task_id}/content -> binary mp4 (or redirect to CDN URL)
 */

export type AISpliceVideoModel =
  | 'doubao-seedance-2.5'
  | 'doubao-seedance-2.0'
  | 'doubao-seedance-2.0-fast'
  | 'doubao-seedance-2.0-mini'

export type AISpliceVideoResolution = '480p' | '720p' | '1080p'
export type AISpliceVideoSize =
  | '16:9'
  | '9:16'
  | '1:1'
  | '4:3'
  | '3:4'
  | '21:9'
  | 'adaptive'

export interface AISpliceCreateVideoInput {
  prompt: string
  model?: AISpliceVideoModel
  /** Reference image URLs (up to 30 for Seedance 2.5). */
  referenceImageUrls?: string[]
  /** Optional last-frame URL (requires 1 image in referenceImageUrls and size='adaptive'). */
  imageTailUrl?: string
  /** Duration in seconds (4-30, or -1 for automatic). Default: 4. */
  duration?: number
  /** Resolution ('480p' | '720p' | '1080p'). Default: '480p'. */
  resolution?: AISpliceVideoResolution
  /** Aspect ratio / size. Default: '9:16'. */
  aspectRatio?: AISpliceVideoSize
  /** Whether to generate synchronized native audio. Default: true. */
  generateAudio?: boolean
  /** Whether to run pre-generation content moderation. Default: true. */
  nsfwCheck?: boolean
  /** Optional webhook URL notified on terminal status (`task.completed` / `task.failed`). */
  webhookUrl?: string
}

export interface AISpliceSubmitResponse {
  id?: string
  task_id?: string
  status?: string
  error?: {
    message?: string
    type?: string
    code?: string
  } | string
  message?: string
  code?: string
}

export interface AISpliceTaskStatusResponse {
  id?: string
  task_id?: string
  status?: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'unknown' | string
  progress?: string
  url?: string
  fail_reason?: string
  metadata?: {
    url?: string
    last_frame_url?: string
    [key: string]: unknown
  }
  output?: {
    url?: string
    video_url?: string
    [key: string]: unknown
  }
  error?: {
    message?: string
    type?: string
    code?: string
  } | string
  message?: string
}

export interface NormalizedAISpliceTaskStatus {
  taskId: string
  state: 'waiting' | 'success' | 'fail'
  rawStatus: string
  videoUrl?: string
  error?: string
}

export class AISpliceVideoService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly webhookUrl?: string

  constructor(options?: { apiKey?: string; baseUrl?: string; webhookUrl?: string }) {
    this.apiKey = options?.apiKey || process.env.AISPLICE_API_KEY || ''
    this.baseUrl = (
      options?.baseUrl ||
      process.env.AISPLICE_BASE_URL ||
      'https://www.aisplice.store'
    ).replace(/\/$/, '')
    this.webhookUrl =
      options?.webhookUrl ||
      process.env.AISPLICE_VIDEO_CALLBACK_URL ||
      (process.env.KIE_CALLBACK_URL
        ? process.env.KIE_CALLBACK_URL.replace(/\/api\/kie\/callback$/, '/api/video/callback')
        : undefined)

    if (!this.apiKey) {
      throw new Error('AISPLICE_API_KEY is required for AISpliceVideoService')
    }
  }

  /**
   * Submit an async video generation task via `POST /v1/videos`.
   * Returns the gateway `task_id`.
   */
  async createVideoTask(input: AISpliceCreateVideoInput): Promise<string> {
    const prompt = input.prompt?.trim()
    if (!prompt) {
      throw new Error('AISpliceVideoService: prompt is required')
    }

    const model: AISpliceVideoModel = input.model ?? 'doubao-seedance-2.5'
    const duration = input.duration ?? 4
    const resolution: AISpliceVideoResolution = input.resolution ?? '480p'
    const size: AISpliceVideoSize = input.aspectRatio ?? '9:16'
    const generateAudio = input.generateAudio ?? true
    const nsfwCheck = input.nsfwCheck ?? true

    const body: Record<string, unknown> = {
      model,
      prompt,
      duration,
      resolution,
      size,
      nsfw_check: nsfwCheck,
      metadata: {
        generate_audio: generateAudio,
        watermark: false,
        output_format: 'mp4',
      },
    }

    if (input.referenceImageUrls && input.referenceImageUrls.length > 0) {
      body.images = input.referenceImageUrls
    }

    if (input.imageTailUrl) {
      body.image_tail = input.imageTailUrl
    }

    const webhook = input.webhookUrl ?? this.webhookUrl
    if (webhook && /^https:\/\//.test(webhook)) {
      body.webhook_url = webhook
    }

    console.log(`🎬 Creating AISplice video task (${model})...`)
    console.log(`📍 API URL: ${this.baseUrl}/v1/videos`)
    console.log(`📐 ${resolution} ${size} ${duration}s (images: ${input.referenceImageUrls?.length ?? 0})`)

    const response = await fetch(`${this.baseUrl}/v1/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text()
    let data: AISpliceSubmitResponse = {}
    try {
      data = rawText ? (JSON.parse(rawText) as AISpliceSubmitResponse) : {}
    } catch {
      throw new Error(
        `AISplice /v1/videos returned non-JSON (${response.status}): ${rawText.slice(0, 200)}`
      )
    }

    const taskId = data.task_id || data.id
    if (!response.ok || !taskId) {
      const errMsg =
        (typeof data.error === 'object' && data.error?.message) ||
        (typeof data.error === 'string' && data.error) ||
        data.message ||
        `HTTP ${response.status}`
      throw new Error(`AISplice createVideoTask failed: ${errMsg}`)
    }

    console.log(`✅ AISplice video task created: ${taskId}`)
    return taskId
  }

  /**
   * Poll task status via `GET /v1/videos/{task_id}`.
   * Follows the `/manual/tasks/videos` terminal state contract:
   *   - `completed` -> `state: 'success'`
   *   - `failed` | `cancelled` -> `state: 'fail'`
   *   - everything else (`queued`, `in_progress`, `unknown`) -> `state: 'waiting'`
   */
  async getTaskStatus(taskId: string): Promise<NormalizedAISpliceTaskStatus> {
    const response = await fetch(
      `${this.baseUrl}/v1/videos/${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        cache: 'no-store',
      }
    )

    const rawText = await response.text()
    let data: AISpliceTaskStatusResponse = {}
    try {
      data = rawText ? (JSON.parse(rawText) as AISpliceTaskStatusResponse) : {}
    } catch {
      throw new Error(
        `AISplice getTaskStatus returned non-JSON (${response.status}): ${rawText.slice(0, 200)}`
      )
    }

    if (!response.ok) {
      const errMsg =
        (typeof data.error === 'object' && data.error?.message) ||
        (typeof data.error === 'string' && data.error) ||
        data.message ||
        `HTTP ${response.status}`
      throw new Error(`AISplice getTaskStatus failed: ${errMsg}`)
    }

    return AISpliceVideoService.normalizeTaskStatus(taskId, data)
  }

  static normalizeTaskStatus(
    fallbackTaskId: string,
    data: AISpliceTaskStatusResponse
  ): NormalizedAISpliceTaskStatus {
    const taskId = data.task_id || data.id || fallbackTaskId
    const rawStatus = (data.status || 'queued').toLowerCase()

    const videoUrl =
      data.url ||
      data.metadata?.url ||
      data.output?.url ||
      data.output?.video_url ||
      undefined

    if (rawStatus === 'completed' || rawStatus === 'succeeded') {
      return {
        taskId,
        state: 'success',
        rawStatus,
        videoUrl,
      }
    }

    if (rawStatus === 'failed' || rawStatus === 'cancelled') {
      const errMsg =
        data.fail_reason ||
        (typeof data.error === 'object' ? data.error?.message : data.error) ||
        data.message ||
        'Video generation failed'
      return {
        taskId,
        state: 'fail',
        rawStatus,
        error: errMsg,
      }
    }

    return {
      taskId,
      state: 'waiting',
      rawStatus,
    }
  }

  /**
   * Download the finished MP4 buffer for a completed task.
   * Tries `GET /v1/videos/{task_id}/content` with Bearer auth first,
   * and falls back to `directUrl` (`metadata.url` / `url`) if provided.
   */
  async downloadVideoBuffer(
    taskId: string,
    directUrl?: string,
    attempts = 3,
    timeoutMs = 60_000
  ): Promise<Buffer> {
    const contentEndpoint = `${this.baseUrl}/v1/videos/${encodeURIComponent(taskId)}/content`
    const candidates: Array<{ url: string; headers?: Record<string, string> }> = [
      {
        url: contentEndpoint,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
    ]

    if (directUrl && /^https?:\/\//.test(directUrl) && directUrl !== contentEndpoint) {
      candidates.push({ url: directUrl })
    }

    let lastError: unknown
    for (const candidate of candidates) {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), timeoutMs)
          const res = await fetch(candidate.url, {
            headers: candidate.headers,
            redirect: 'follow',
            signal: controller.signal,
          })
          clearTimeout(timer)

          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`)
          }

          const contentType = res.headers.get('content-type') || ''
          // Sometimes /content may return JSON with a redirect URL
          if (contentType.includes('application/json')) {
            const json = (await res.json()) as { url?: string; data?: { url?: string } }
            const targetUrl = json.url || json.data?.url
            if (targetUrl && /^https?:\/\//.test(targetUrl)) {
              const videoRes = await fetch(targetUrl)
              if (!videoRes.ok) {
                throw new Error(`Video CDN HTTP ${videoRes.status}`)
              }
              return Buffer.from(await videoRes.arrayBuffer())
            }
          }

          const buf = Buffer.from(await res.arrayBuffer())
          if (buf.length < 1000) {
            throw new Error(`Downloaded buffer too small (${buf.length} bytes)`)
          }
          return buf
        } catch (err) {
          lastError = err
          if (attempt < attempts) {
            await new Promise((r) => setTimeout(r, 1000 * attempt))
          }
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to download video from AISplice')
  }
}
