import { createServiceClient } from '@/lib/supabase-server';
import { KIEImageService } from '@/lib/kie-api/kie-image-service';
import { uploadImageToR2 } from '@/lib/r2';
import { screenPrompt } from '@/lib/moderation';
import { deductCredits, refundCredits, InsufficientCreditsError } from '@/lib/credits';

export const IMAGE_CREDIT_COST = 5;

export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface GenerateResult {
  imageUrl: string;
  creditsCharged: number;
  creditsRemaining: number;
}

export class ModerationRejectedError extends Error {
  constructor() {
    super('prompt_rejected');
    this.name = 'ModerationRejectedError';
  }
}

export class ModerationUnavailableError extends Error {
  constructor() {
    super('moderation_unavailable');
    this.name = 'ModerationUnavailableError';
  }
}

export { InsufficientCreditsError };

/**
 * Synchronous single-image generation for programmatic/MCP callers.
 * Deducts credits up front, waits for KIE, uploads to R2, records the image,
 * and refunds automatically if generation fails after the charge.
 */
export async function generateImageSync(
  userId: string,
  prompt: string,
  aspectRatio: AspectRatio = '1:1'
): Promise<GenerateResult> {
  const service = createServiceClient();

  // 1. Content policy. Service errors are retryable (not a rejection); only an
  // explicit deny/flag is a real content rejection.
  const moderation = await screenPrompt(prompt, `user_${userId}`);
  if (!moderation.allowed) {
    if (moderation.decision === 'error') throw new ModerationUnavailableError();
    throw new ModerationRejectedError();
  }

  // 2. Atomic charge (throws InsufficientCreditsError)
  const creditsRemaining = await deductCredits(
    service,
    userId,
    IMAGE_CREDIT_COST,
    'usage',
    'MCP/API image generation'
  );

  // 3. Generate + wait. Refund on any failure past this point.
  try {
    const ratio = aspectRatio === '16:9' ? '1:1' : aspectRatio; // KIE prompt-only supports 9:16|1:1
    const kie = new KIEImageService();
    const taskId = await kie.createPromptOnlyTask(prompt, ratio, 'google/nano-banana');
    const kieUrl = await kie.waitForTaskCompletion(taskId);

    const resp = await fetch(kieUrl);
    if (!resp.ok) throw new Error(`Failed to download generated image: ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const imageUrl = await uploadImageToR2(buffer, `mcp-${taskId}.png`, 'image/png');

    await service.from('images').insert([
      {
        user_id: userId,
        prompt,
        processed_image_url: imageUrl,
        status: 'completed',
        image_type: 'generation',
        cost: IMAGE_CREDIT_COST,
        external_task_id: taskId,
        metadata: { source: 'mcp' },
      },
    ]);

    return { imageUrl, creditsCharged: IMAGE_CREDIT_COST, creditsRemaining };
  } catch (err) {
    await refundCredits(service, userId, IMAGE_CREDIT_COST, 'Refund: image generation failed');
    throw err;
  }
}
