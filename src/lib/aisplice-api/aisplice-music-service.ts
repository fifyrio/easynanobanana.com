/**
 * AISplice Music Generation Service (`https://www.aisplice.store/v1/music`)
 *
 * Implements Suno V6 music generation via AISplice:
 *   1. Submit:  POST /v1/music/generations (with `Idempotency-Key: <uuid>`)
 *   2. Poll:    GET  /v1/music/tasks/{taskId}
 *   3. Content: GET  /v1/music/tasks/{taskId}/content
 */

import crypto from 'crypto'
import {
  buildGameSoundPrompt,
  type CreateSoundTaskOptions,
  type NormalizedSoundClip,
} from '@/lib/kie-api/kie-sound-service'

export interface AISpliceMusicClipRaw {
  audio_id?: string
  id?: string
  audio_url?: string
  url?: string
  image_url?: string
  image_large_url?: string
  duration?: number
  title?: string
  tags?: string
  display_tags?: string
  lyrics?: string
  status?: string
  created_at?: string
}

export interface AISpliceMusicTaskStatusResponse {
  id?: string
  task_id?: string
  object?: string
  model?: string
  operation?: string
  status?: string
  state?: string
  progress?: string
  url?: string
  fail_reason?: string
  message?: string
  error?:
    | {
        message?: string
        type?: string
        code?: string
      }
    | string
  assets?: Array<{
    type?: string
    url?: string
  }>
  billing?: {
    settled?: boolean
    quota?: number
    cost_usd?: number
  }
  data?: {
    lyrics?: {
      text?: string
      title?: string
    }
    music?: AISpliceMusicClipRaw[]
    result?: {
      music?: AISpliceMusicClipRaw[]
    }
  }
}

export interface AISpliceMusicServiceConfig {
  apiKey?: string
  baseUrl?: string
}

export class AISpliceMusicService {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config?: AISpliceMusicServiceConfig) {
    this.apiKey = config?.apiKey || process.env.AISPLICE_API_KEY || ''
    this.baseUrl = (
      config?.baseUrl ||
      process.env.AISPLICE_BASE_URL ||
      'https://www.aisplice.store'
    ).replace(/\/$/, '')
  }

  async createTask(options: CreateSoundTaskOptions): Promise<{
    taskId: string
    effectivePrompt: string
  }> {
    if (!this.apiKey) {
      throw new Error('AISPLICE_API_KEY is required for AISpliceMusicService')
    }

    const mode = options.mode || 'music'
    const durationHint = options.durationHint || 'auto'
    const effectivePrompt = buildGameSoundPrompt(
      options.prompt,
      mode,
      durationHint
    )

    // AISplice Suno v6 supports instrumental toggle; game music & SFX default to instrumental
    const isVocalMode =
      mode === 'human-voice' ||
      mode === 'non-human-voice' ||
      mode === 'speech-clone' ||
      mode === 'speech-preset'

    const body = {
      model: 'Suno',
      prompt: effectivePrompt,
      operation: 'music',
      version: 'v6',
      custom: false,
      instrumental: !isVocalMode,
    }

    const idempotencyKey = crypto.randomUUID()

    const response = await fetch(`${this.baseUrl}/v1/music/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text()
    let data: AISpliceMusicTaskStatusResponse = {}
    try {
      data = rawText
        ? (JSON.parse(rawText) as AISpliceMusicTaskStatusResponse)
        : {}
    } catch {
      throw new Error(
        `AISplice /v1/music/generations returned non-JSON (${response.status}): ${rawText.slice(0, 200)}`
      )
    }

    const rawTaskId = data.task_id || data.id
    if (!response.ok || !rawTaskId) {
      const errMsg =
        (typeof data.error === 'object' && data.error?.message) ||
        (typeof data.error === 'string' && data.error) ||
        data.message ||
        `HTTP ${response.status}`
      throw new Error(`AISplice createTask failed: ${errMsg}`)
    }

    return {
      taskId: `aisplice:${rawTaskId}`,
      effectivePrompt,
    }
  }

  async getTaskStatus(taskIdOrPrefixed: string): Promise<{
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail' | 'failed'
    clips: NormalizedSoundClip[]
    failMsg?: string
    creditsConsumed?: number
    costTime?: number
  }> {
    if (!this.apiKey) {
      throw new Error('AISPLICE_API_KEY is required for AISpliceMusicService')
    }

    const rawTaskId = AISpliceMusicService.stripPrefix(taskIdOrPrefixed)
    const response = await fetch(
      `${this.baseUrl}/v1/music/tasks/${encodeURIComponent(rawTaskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        cache: 'no-store',
      }
    )

    const rawText = await response.text()
    let payload: AISpliceMusicTaskStatusResponse = {}
    try {
      payload = rawText
        ? (JSON.parse(rawText) as AISpliceMusicTaskStatusResponse)
        : {}
    } catch {
      throw new Error(
        `AISplice music task status returned non-JSON (${response.status}): ${rawText.slice(0, 200)}`
      )
    }

    if (!response.ok) {
      const errMsg =
        (typeof payload.error === 'object' && payload.error?.message) ||
        (typeof payload.error === 'string' && payload.error) ||
        payload.message ||
        `HTTP ${response.status}`
      throw new Error(`AISplice getTaskStatus failed: ${errMsg}`)
    }

    const rawStatus = String(
      payload.status || payload.state || 'queued'
    ).toLowerCase()

    if (
      rawStatus === 'completed' ||
      rawStatus === 'succeeded' ||
      rawStatus === 'success'
    ) {
      let clips = AISpliceMusicService.extractClips(rawTaskId, payload)
      if (clips.length === 0) {
        clips = await this.getContentClips(rawTaskId)
      }
      return {
        state: 'success',
        clips,
      }
    }

    if (
      rawStatus === 'failed' ||
      rawStatus === 'failure' ||
      rawStatus === 'cancelled' ||
      rawStatus === 'canceled'
    ) {
      const failMsg =
        payload.fail_reason ||
        (typeof payload.error === 'object'
          ? payload.error?.message
          : payload.error) ||
        payload.message ||
        'AISplice music generation failed'
      return {
        state: 'failed',
        clips: [],
        failMsg,
      }
    }

    return {
      state: rawStatus === 'queued' ? 'queuing' : 'generating',
      clips: [],
    }
  }

  /**
   * Queries `GET /v1/music/tasks/{taskId}/content`.
   * Note: AISplice `/content` may return either JSON metadata or an `audio/mpeg` binary stream.
   */
  async getContentClips(rawTaskId: string): Promise<NormalizedSoundClip[]> {
    const cleanId = AISpliceMusicService.stripPrefix(rawTaskId)
    const contentUrl = `${this.baseUrl}/v1/music/tasks/${encodeURIComponent(cleanId)}/content`
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as AISpliceMusicTaskStatusResponse
      return AISpliceMusicService.extractClips(cleanId, data)
    }

    // If /content returns binary audio directly, expose the content endpoint URL
    return [
      {
        id: `${cleanId}-1`,
        audioUrl: contentUrl,
      },
    ]
  }

  static stripPrefix(taskId: string): string {
    return taskId.startsWith('aisplice:')
      ? taskId.slice('aisplice:'.length)
      : taskId
  }

  static extractClips(
    rawTaskId: string,
    payload: AISpliceMusicTaskStatusResponse
  ): NormalizedSoundClip[] {
    const resultMusic = payload.data?.result?.music
    if (Array.isArray(resultMusic) && resultMusic.length > 0) {
      const clips = resultMusic
        .filter((item) => Boolean(item && (item.audio_url || item.url)))
        .map((item, idx) => ({
          id: item.audio_id || item.id || `${rawTaskId}-${idx + 1}`,
          audioUrl: item.audio_url || item.url || '',
          imageUrl: item.image_url || item.image_large_url,
          duration:
            typeof item.duration === 'number' ? item.duration : undefined,
          title: item.title || payload.data?.lyrics?.title,
          tags: item.display_tags || item.tags,
        }))
      if (clips.length > 0) {
        return clips
      }
    }

    if (Array.isArray(payload.assets)) {
      const audioAssets = payload.assets.filter(
        (a) => a && a.type === 'audio' && a.url
      )
      if (audioAssets.length > 0) {
        return audioAssets.map((asset, idx) => ({
          id: `${rawTaskId}-${idx + 1}`,
          audioUrl: asset.url!,
          title: payload.data?.lyrics?.title,
        }))
      }
    }

    const directMusic = payload.data?.music
    if (Array.isArray(directMusic) && directMusic.length > 0) {
      return directMusic
        .filter((item) => Boolean(item && (item.audio_url || item.url)))
        .map((item, idx) => ({
          id: item.audio_id || item.id || `${rawTaskId}-${idx + 1}`,
          audioUrl: item.audio_url || item.url || '',
          title: item.title || payload.data?.lyrics?.title,
        }))
    }

    return []
  }
}
