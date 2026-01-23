/**
 * KIE API Type Definitions
 *
 * This file contains all type definitions for the KIE image generation service.
 * It has ZERO dependencies to prevent circular dependency issues.
 */

// ===== KIE API Response Types =====

export interface KIECreateTaskResponse {
  code: number
  message: string
  data: {
    taskId: string
  }
}

export interface KIECallbackResponse {
  code: number
  data: {
    completeTime: number
    consumeCredits: number
    costTime: number
    createTime: number
    model: string
    param: string
    remainedCredits: number
    resultJson: string
    state: 'success' | 'failed'
    taskId: string
    updateTime: number
  }
  msg: string
}

export interface KIEResultJson {
  resultUrls: string[]
}

// ===== Task Status =====

export type KIETaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'

// ===== Task Metadata =====

/**
 * Metadata for a KIE task stored in R2
 */
export interface KIETaskMetadata {
  taskId: string
  status: KIETaskStatus
  prompt: string
  imageUrl: string
  userId?: string
  imageType?: 'generation' | 'background_removal' | 'edit' | 'template'
  metadata?: Record<string, unknown>
  character?: string
  clothingImageUrl?: string // For outfit-change-v2, stores clothing image URL
  createdAt: string
  updatedAt: string
  resultUrls?: string[]
  error?: string
  consumeCredits?: number
  costTime?: number
}

// ===== Image Generation Result =====

/**
 * Result from image generation operations
 */
export interface ImageGenerationResult {
  prompt: string
  imageUrl: string
  success: boolean
  timestamp: Date
  result?: string
  error?: string
  savedPath?: string
  decodedImage?: {
    mimeType: string
    buffer: Buffer
    size: number
  }
}
