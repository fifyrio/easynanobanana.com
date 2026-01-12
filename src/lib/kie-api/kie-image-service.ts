/**
 * KIE Image Generation Service
 *
 * A thin wrapper around the KIE API (https://api.kie.ai) for async image generation.
 * This service focuses purely on API communication - all business logic (prompts, metadata)
 * is handled by the caller.
 *
 * Features:
 * - Zero hardcoded prompts - caller provides all prompts
 * - Optional storage injection for metadata persistence
 * - Support for multiple KIE models (nano-banana, nano-banana-edit, nano-banana-pro)
 * - Clean async/await API
 */

import type {
  KIECreateTaskResponse,
  KIECallbackResponse,
  KIEResultJson,
  KIETaskMetadata,
  ImageGenerationResult,
} from './types'
import type { ITaskMetadataStorage } from './storage'

// ===== Service Configuration =====

export interface KIEServiceConfig {
  apiToken?: string
  callbackUrl?: string
  storage?: ITaskMetadataStorage
}

// ===== KIE Image Service Class =====

export class KIEImageService {
  private apiToken: string
  private baseUrl: string
  private callbackUrl: string
  private storage?: ITaskMetadataStorage

  constructor(config?: KIEServiceConfig) {
    this.apiToken = config?.apiToken || process.env.KIE_API_TOKEN || ''
    this.baseUrl = 'https://api.kie.ai/api/v1/jobs'
    this.callbackUrl = config?.callbackUrl || process.env.KIE_CALLBACK_URL || ''
    this.storage = config?.storage

    if (!this.apiToken) {
      console.warn('⚠️  KIE_API_TOKEN not configured')
    }

    if (!this.callbackUrl) {
      console.warn('⚠️  KIE_CALLBACK_URL not configured')
    }
  }

  // ===== Core API Methods =====

  /**
   * Create a KIE task with image input
   *
   * @param prompt - Full prompt text (caller constructs)
   * @param imageUrls - Single or multiple image URLs
   * @param imageRatio - Image aspect ratio
   * @param model - KIE model to use
   * @returns Task ID
   */
  async createTask(
    prompt: string,
    imageUrls: string | string[],
    imageRatio: '9:16' | '1:1' = '9:16',
    model: string = 'google/nano-banana-edit'
  ): Promise<string> {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls]

    try {
      console.log(`🔄 Creating KIE task...`)
      console.log(`📍 API URL: ${this.baseUrl}/createTask`)
      console.log(`📝 Prompt length: ${prompt.length} chars`)
      console.log(`🖼️  Image URLs: ${urls.join(', ')} image(s)`)
      console.log(`🤖 Model: ${model}`)

      const requestBody = {
        model,
        callBackUrl: this.callbackUrl,
        input: {
          prompt,
          image_urls: urls,
          output_format: 'png',
          image_size: imageRatio,
        },
      }

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
        console.error(`❌ KIE API HTTP error: ${response.status} ${response.statusText}`)
        console.error(`❌ Response body: ${errorText}`)
        throw new Error(`KIE API request failed: ${response.status} ${errorText}`)
      }

      const responseText = await response.text()
      console.log(`📦 KIE API Response: ${responseText}`)

      let result: KIECreateTaskResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error(`❌ Failed to parse KIE API response as JSON`)
        console.error(`❌ Response text: ${responseText}`)
        throw new Error(`KIE API returned invalid JSON: ${responseText.substring(0, 200)}`)
      }

      if (result.code !== 200) {
        console.error(`❌ KIE API error code: ${result.code}`)
        console.error(`❌ KIE API error message: ${result.message || 'No error message provided'}`)
        const errorMsg = result.message || `Unknown error (code: ${result.code})`
        throw new Error(`KIE API error: ${errorMsg}`)
      }

      console.log(`✅ KIE task created: ${result.data.taskId}`)
      return result.data.taskId
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Network/Fetch error: ${error.message}`)
        if (error.message === 'fetch failed' || error.name === 'FetchError') {
          throw new Error(
            `Network connection failed. Please check: 1) Internet connectivity, 2) KIE API URL (${this.baseUrl}), 3) Firewall/proxy settings. Original error: ${error.message}`
          )
        }
      }
      throw error
    }
  }

  /**
   * Create a KIE task with prompt only (no image input)
   *
   * @param prompt - Full prompt text
   * @param imageRatio - Image aspect ratio
   * @param model - KIE model to use
   * @returns Task ID
   */
  async createPromptOnlyTask(
    prompt: string,
    imageRatio: '9:16' | '1:1' = '9:16',
    model: string = 'google/nano-banana'
  ): Promise<string> {
    try {
      console.log(`🔄 Creating prompt-only KIE task...`)
      console.log(`📝 Prompt length: ${prompt.length} chars`)
      console.log(`🤖 Model: ${model}`)

      const response = await fetch(`${this.baseUrl}/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          model,
          callBackUrl: this.callbackUrl,
          input: {
            prompt,
            output_format: 'png',
            image_size: imageRatio,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ KIE prompt-only HTTP error: ${response.status}`)
        throw new Error(`KIE API request failed: ${response.status} ${errorText}`)
      }

      const result: KIECreateTaskResponse = await response.json()

      if (result.code !== 200) {
        throw new Error(`KIE API error: ${result.message || 'Unknown error'}`)
      }

      console.log(`✅ KIE prompt-only task created: ${result.data.taskId}`)
      return result.data.taskId
    } catch (error) {
      console.error(`❌ Prompt-only task error:`, error)
      throw error
    }
  }

  /**
   * Create a KIE Pro task (different parameter structure)
   *
   * @param prompt - Full prompt text
   * @param imageInputs - Single or multiple image URLs
   * @param aspectRatio - Image aspect ratio
   * @param resolution - Image resolution
   * @returns Task ID
   */
  async createProTask(
    prompt: string,
    imageInputs: string | string[],
    aspectRatio: '9:16' | '1:1' = '9:16',
    resolution: '1K' | '2K' = '2K'
  ): Promise<string> {
    const urls = Array.isArray(imageInputs) ? imageInputs : [imageInputs]

    try {
      console.log(`🔄 Creating KIE PRO task...`)
      console.log(`📝 Prompt length: ${prompt.length} chars`)
      console.log(`🖼️  Image inputs: ${urls.length} image(s)`)
      console.log(`🎞️  Aspect Ratio: ${aspectRatio}, Resolution: ${resolution}`)

      const requestBody = {
        model: 'nano-banana-pro',
        callBackUrl: this.callbackUrl,
        input: {
          prompt,
          image_input: urls,
          aspect_ratio: aspectRatio,
          resolution,
          output_format: 'png',
        },
      }

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
        console.error(`❌ KIE PRO API HTTP error: ${response.status}`)
        throw new Error(`KIE PRO API request failed: ${response.status} ${errorText}`)
      }

      const result: KIECreateTaskResponse = await response.json()

      if (result.code !== 200) {
        throw new Error(`KIE PRO API error: ${result.message || 'Unknown error'}`)
      }

      console.log(`✅ KIE PRO task created: ${result.data.taskId}`)
      return result.data.taskId
    } catch (error) {
      console.error(`❌ KIE PRO error:`, error)
      throw error
    }
  }

  /**
   * Query task status
   *
   * @param taskId - Task ID to query
   * @returns Task details
   */
  async getTaskStatus(taskId: string): Promise<KIECallbackResponse['data']> {
    const response = await fetch(`${this.baseUrl}/getTask?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE API request failed: ${response.status} ${errorText}`)
    }

    const result: KIECallbackResponse = await response.json()

    if (result.code !== 200) {
      throw new Error(`KIE API error: ${result.msg}`)
    }

    return result.data
  }

  /**
   * Poll for task completion
   *
   * @param taskId - Task ID to wait for
   * @param maxAttempts - Maximum polling attempts
   * @param intervalMs - Polling interval in milliseconds
   * @returns Generated image URL
   */
  async waitForTaskCompletion(
    taskId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTaskStatus(taskId)

      if (status.state === 'success') {
        const resultJson: KIEResultJson = JSON.parse(status.resultJson)
        if (resultJson.resultUrls && resultJson.resultUrls.length > 0) {
          console.log(`✅ KIE task completed: ${taskId}`)
          return resultJson.resultUrls[0]
        }
        throw new Error('KIE task completed but no result URLs found')
      }

      if (status.state === 'failed') {
        throw new Error(`KIE task failed: ${taskId}`)
      }

      console.log(`⏳ KIE task ${taskId} still processing (attempt ${i + 1}/${maxAttempts})...`)
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    throw new Error(`KIE task timeout: ${taskId} (max attempts: ${maxAttempts})`)
  }

  // ===== High-Level Async Methods (with optional metadata storage) =====

  /**
   * Create an image generation task (async mode)
   *
   * @param prompt - Full prompt constructed by caller
   * @param imageUrl - Reference image URL
   * @param metadata - Optional additional metadata to save
   * @returns Result with taskId
   */
  async generateImage(
    prompt: string,
    imageUrl: string,
    metadata?: Partial<KIETaskMetadata>
  ): Promise<ImageGenerationResult & { taskId?: string }> {
    const startTime = new Date()

    try {
      const taskId = await this.createTask(prompt, imageUrl)

      // Optional metadata save
      if (this.storage) {
        await this.storage.save({
          taskId,
          status: 'pending',
          prompt,
          imageUrl,
          createdAt: startTime.toISOString(),
          updatedAt: startTime.toISOString(),
          ...metadata,
        })
      }

      return {
        prompt,
        imageUrl,
        success: true,
        timestamp: startTime,
        taskId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ KIE task creation failed: ${errorMessage}`)

      return {
        prompt,
        imageUrl,
        success: false,
        error: errorMessage,
        timestamp: startTime,
      }
    }
  }

  /**
   * Create a multi-image task (async mode)
   *
   * @param prompt - Full prompt constructed by caller
   * @param imageUrls - Array of image URLs
   * @param metadata - Optional additional metadata to save
   * @param useProModel - Whether to use Pro model
   * @returns Result with taskId
   */
  async generateMultiImage(
    prompt: string,
    imageUrls: string[],
    metadata?: Partial<KIETaskMetadata>,
    useProModel: boolean = false
  ): Promise<ImageGenerationResult & { taskId?: string }> {
    const startTime = new Date()

    try {
      const taskId = useProModel
        ? await this.createProTask(prompt, imageUrls, '9:16', '2K')
        : await this.createTask(prompt, imageUrls, '9:16', 'google/nano-banana-edit')

      // Optional metadata save
      if (this.storage) {
        await this.storage.save({
          taskId,
          status: 'pending',
          prompt,
          imageUrl: imageUrls[0], // Primary image
          createdAt: startTime.toISOString(),
          updatedAt: startTime.toISOString(),
          ...metadata,
        })
      }

      return {
        prompt,
        imageUrl: imageUrls[0],
        success: true,
        timestamp: startTime,
        taskId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Multi-image task creation failed: ${errorMessage}`)

      return {
        prompt,
        imageUrl: imageUrls[0],
        success: false,
        error: errorMessage,
        timestamp: startTime,
      }
    }
  }

  /**
   * Create a prompt-only task (async mode)
   *
   * @param prompt - Full prompt text
   * @param options - Optional configuration
   * @returns Result with taskId
   */
  async generateFromPrompt(
    prompt: string,
    options?: {
      aspectRatio?: '9:16' | '1:1'
      model?: string
      metadata?: Partial<KIETaskMetadata>
    }
  ): Promise<ImageGenerationResult & { taskId?: string }> {
    const startTime = new Date()
    const aspectRatio = options?.aspectRatio ?? '9:16'
    const model = options?.model ?? 'google/nano-banana'

    try {
      const taskId = await this.createPromptOnlyTask(prompt, aspectRatio, model)

      // Optional metadata save
      if (this.storage) {
        await this.storage.save({
          taskId,
          status: 'pending',
          prompt,
          imageUrl: '',
          createdAt: startTime.toISOString(),
          updatedAt: startTime.toISOString(),
          ...options?.metadata,
        })
      }

      return {
        prompt,
        imageUrl: '',
        success: true,
        timestamp: startTime,
        taskId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Prompt-only task creation failed: ${errorMessage}`)

      return {
        prompt,
        imageUrl: '',
        success: false,
        error: errorMessage,
        timestamp: startTime,
      }
    }
  }

  // ===== Static Utility Methods =====

  /**
   * Process KIE callback response
   * Use in API routes to handle callbacks
   *
   * @param callbackData - Callback data from KIE
   * @returns Processed result
   */
  static processCallback(callbackData: KIECallbackResponse): {
    taskId: string
    success: boolean
    resultUrls?: string[]
    error?: string
  } {
    const { data } = callbackData

    if (data.state === 'success') {
      const resultJson: KIEResultJson = JSON.parse(data.resultJson)
      return {
        taskId: data.taskId,
        success: true,
        resultUrls: resultJson.resultUrls,
      }
    }

    return {
      taskId: data.taskId,
      success: false,
      error: `Task failed with state: ${data.state}`,
    }
  }
}
