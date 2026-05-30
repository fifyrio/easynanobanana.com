/**
 * KIE Video Generation Service (Seedance 2 Fast)
 *
 * Sibling to KIEImageService. Uses the SAME KIE /jobs endpoint and the SAME
 * KIE_API_TOKEN, but targets ByteDance Seedance 2 Fast for video generation.
 *
 * Flow:
 *   1. createSeedanceTask(...) → returns taskId immediately
 *   2. KIE generates async (typ. 30s-3min for 5s 720p)
 *   3. KIE POSTs to callBackUrl with the result
 *   4. getTaskStatus(...) is a polling fallback
 *
 * Model:  bytedance/seedance-2-fast
 * Docs:   https://docs.kie.ai/market/bytedance/seedance-2-fast
 */

import type { KIECreateTaskResponse } from './types'

// ===== Seedance request types =====

export type SeedanceResolution = '480p' | '720p'

export type SeedanceAspectRatio =
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16'
  | '21:9'
  | 'adaptive'

export interface SeedanceCreateInput {
  /** Text description, 3-20,000 chars. */
  prompt: string
  /** Starting frame URL (image-to-video). HTTPS URL or asset://{assetId}. */
  firstFrameUrl?: string
  /** Optional ending frame URL. */
  lastFrameUrl?: string
  /** Up to 9 reference images. */
  referenceImageUrls?: string[]
  /** 4-15 seconds (default 5). */
  duration?: number
  /** Output resolution (default '720p'). */
  resolution?: SeedanceResolution
  /** Aspect ratio (default '16:9'). */
  aspectRatio?: SeedanceAspectRatio
  /** Generate audio track (default true — note: affects cost). */
  generateAudio?: boolean
  /** NSFW filter (default false = filtering disabled). */
  nsfwChecker?: boolean
}

// ===== Seedance response types =====

/**
 * Task state values returned by /recordInfo (polling) and via callback.
 *
 * Note: The polling endpoint documents `'fail'`, but other KIE endpoints
 * have used `'failed'` historically — accept both in processCallback.
 */
export type SeedanceTaskState =
  | 'waiting'
  | 'queuing'
  | 'generating'
  | 'success'
  | 'fail'

export interface SeedanceTaskDetails {
  taskId: string
  model: string
  state: SeedanceTaskState
  /** JSON string: parse to { resultUrls: string[], firstFrameUrl?, lastFrameUrl? } */
  resultJson: string
  failCode: string
  failMsg: string
  costTime: number
  completeTime: number
  createTime: number
  updateTime: number
  progress: number
  creditsConsumed: number
}

export interface SeedanceTaskDetailsResponse {
  code: number
  msg: string
  data: SeedanceTaskDetails
}

export interface SeedanceResultJson {
  resultUrls: string[]
  firstFrameUrl?: string
  lastFrameUrl?: string
}

/**
 * Callback payload posted by KIE to the configured callBackUrl on completion.
 *
 * Permissive on state: accepts `'failed'` defensively even though docs only
 * list `'fail'`, because other KIE callback payloads in this codebase use
 * `'failed'` for the image-generation flow.
 */
export interface SeedanceCallbackResponse {
  code: number
  msg: string
  data: {
    taskId: string
    model: string
    state: SeedanceTaskState | 'failed'
    resultJson: string
    consumeCredits?: number
    costTime?: number
    failCode?: string
    failMsg?: string
  }
}

// ===== Service config =====

export interface KIEVideoServiceConfig {
  apiToken?: string
  callbackUrl?: string
}

const SEEDANCE_MODEL = 'bytedance/seedance-2-fast'
const KIE_JOBS_BASE_URL = 'https://api.kie.ai/api/v1/jobs'

// ===== Service =====

export class KIEVideoService {
  private apiToken: string
  private baseUrl: string
  private callbackUrl: string

  constructor(config?: KIEVideoServiceConfig) {
    this.apiToken = config?.apiToken || process.env.KIE_API_TOKEN || ''
    this.baseUrl = KIE_JOBS_BASE_URL
    this.callbackUrl =
      config?.callbackUrl || process.env.KIE_VIDEO_CALLBACK_URL || ''

    if (!this.apiToken) {
      console.warn('⚠️  KIE_API_TOKEN not configured (video service)')
    }
    if (!this.callbackUrl) {
      console.warn('⚠️  KIE_VIDEO_CALLBACK_URL not configured (video service)')
    }
  }

  /**
   * Create a Seedance 2 Fast video generation task.
   * Returns immediately with a taskId; the result is delivered via callback
   * and is also readable via getTaskStatus().
   */
  async createSeedanceTask(input: SeedanceCreateInput): Promise<string> {
    const requestBody = {
      model: SEEDANCE_MODEL,
      callBackUrl: this.callbackUrl,
      input: {
        prompt: input.prompt,
        ...(input.firstFrameUrl ? { first_frame_url: input.firstFrameUrl } : {}),
        ...(input.lastFrameUrl ? { last_frame_url: input.lastFrameUrl } : {}),
        ...(input.referenceImageUrls?.length
          ? { reference_image_urls: input.referenceImageUrls }
          : {}),
        duration: input.duration ?? 5,
        resolution: input.resolution ?? '720p',
        aspect_ratio: input.aspectRatio ?? '16:9',
        generate_audio: input.generateAudio ?? true,
        nsfw_checker: input.nsfwChecker ?? false,
      },
    }

    console.log(`🎬 Creating Seedance task...`)
    console.log(`📍 API URL: ${this.baseUrl}/createTask`)
    console.log(`📝 Prompt length: ${input.prompt.length} chars`)
    console.log(`🖼️  First frame: ${input.firstFrameUrl ?? '(text-to-video)'}`)
    console.log(
      `📐 ${input.resolution ?? '720p'} ${input.aspectRatio ?? '16:9'} ${input.duration ?? 5}s`
    )

    const response = await fetch(`${this.baseUrl}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `KIE Seedance createTask failed: ${response.status} ${errorText}`
      )
    }

    const responseText = await response.text()
    console.log(`📦 KIE response: ${responseText}`)

    let result: KIECreateTaskResponse
    try {
      result = JSON.parse(responseText) as KIECreateTaskResponse
    } catch {
      throw new Error(`KIE returned non-JSON: ${responseText.substring(0, 500)}`)
    }

    if (result.code !== 200) {
      const anyResult = result as unknown as Record<string, unknown>
      const errMsg =
        result.message || (anyResult.msg as string) || `code ${result.code}`
      throw new Error(`KIE Seedance error: ${errMsg} | full: ${responseText}`)
    }

    console.log(`✅ Seedance task created: ${result.data.taskId}`)
    return result.data.taskId
  }

  /**
   * Poll task status. Use as a fallback or for diagnostic purposes — callbacks
   * are the recommended completion-detection mechanism in production.
   */
  async getTaskStatus(taskId: string): Promise<SeedanceTaskDetails> {
    const url = `${this.baseUrl}/recordInfo?taskId=${encodeURIComponent(taskId)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `KIE recordInfo failed: ${response.status} ${errorText}`
      )
    }

    const result = (await response.json()) as SeedanceTaskDetailsResponse
    if (result.code !== 200) {
      throw new Error(
        `KIE recordInfo error: ${result.msg || `code ${result.code}`}`
      )
    }
    return result.data
  }

  /**
   * Normalize either a callback payload or a polled task-details response
   * into a uniform result. Accepts both `'fail'` (poll) and `'failed'`
   * (callback) state strings.
   */
  static processCallback(
    payload: SeedanceCallbackResponse | SeedanceTaskDetailsResponse
  ): {
    taskId: string
    success: boolean
    videoUrl?: string
    firstFrameUrl?: string
    lastFrameUrl?: string
    error?: string
  } {
    const data = payload.data
    const state = data.state

    if (state === 'success') {
      try {
        const parsed = JSON.parse(data.resultJson) as SeedanceResultJson
        const videoUrl = parsed.resultUrls?.[0]
        if (!videoUrl) {
          return {
            taskId: data.taskId,
            success: false,
            error: 'No resultUrls in success payload',
          }
        }
        return {
          taskId: data.taskId,
          success: true,
          videoUrl,
          firstFrameUrl: parsed.firstFrameUrl,
          lastFrameUrl: parsed.lastFrameUrl,
        }
      } catch (err) {
        return {
          taskId: data.taskId,
          success: false,
          error: `Failed to parse resultJson: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    }

    if (state === 'fail' || state === 'failed') {
      const failMsg = 'failMsg' in data ? data.failMsg : undefined
      return {
        taskId: data.taskId,
        success: false,
        error: failMsg || `Task ${state}`,
      }
    }

    // Still pending (waiting / queuing / generating)
    return {
      taskId: data.taskId,
      success: false,
      error: `Task in progress (state: ${state})`,
    }
  }
}
