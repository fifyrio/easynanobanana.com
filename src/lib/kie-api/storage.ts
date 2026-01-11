/**
 * KIE Task Metadata Storage Abstraction
 *
 * This module provides an abstraction layer for persisting KIE task metadata.
 * It allows the KIE service to be decoupled from the specific storage implementation.
 */

import type { KIETaskMetadata } from './types'

/**
 * Interface for task metadata storage operations
 */
export interface ITaskMetadataStorage {
  /**
   * Save task metadata to storage
   */
  save(metadata: KIETaskMetadata): Promise<void>

  /**
   * Retrieve task metadata by task ID
   */
  get(taskId: string): Promise<KIETaskMetadata | null>

  /**
   * Update existing task metadata
   */
  update(taskId: string, updates: Partial<KIETaskMetadata>): Promise<KIETaskMetadata | null>
}

/**
 * Factory function to create a task metadata storage instance
 * backed by R2 cloud storage.
 *
 * Uses dynamic require to avoid circular dependencies.
 */
export function createTaskMetadataStorage(): ITaskMetadataStorage {
  // Dynamic import to break circular dependency chain
  // eslint-disable-next-line
  const { saveKIETaskMetadata, getKIETaskMetadata, updateKIETaskMetadata } = require('../r2')

  return {
    save: saveKIETaskMetadata,
    get: getKIETaskMetadata,
    update: updateKIETaskMetadata,
  }
}
