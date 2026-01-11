/**
 * @deprecated This file is deprecated. Import from '@/lib/r2' instead.
 *
 * All R2 upload functionality has been consolidated into a single module.
 * This file will be removed in a future version.
 *
 * Migration guide:
 * ```typescript
 * // ❌ Old (deprecated)
 * import { uploadImageToR2 } from '@/lib/r2-upload'
 *
 * // ✅ New (recommended)
 * import { uploadImageToR2 } from '@/lib/r2'
 * ```
 */

export {
  // Video processing functions
  extractVideoThumbnail,
  processAndUploadVideo,
  uploadSampleVideos,

  // Image upload functions
  uploadImageToR2,
  uploadToR2,
} from './r2'
