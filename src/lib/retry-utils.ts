export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export class RetryableError extends Error {
  constructor(message: string, public shouldRetry: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffFactor: 2
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof RetryableError && !error.shouldRetry) {
        throw error;
      }
      
      if (attempt === options.maxAttempts) {
        break;
      }
      
      const isRetryableError = 
        error instanceof RetryableError ||
        (error as any)?.status === 429 ||
        (error as any)?.message?.includes('429') ||
        (error as any)?.message?.includes('Too Many Requests') ||
        (error as any)?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (!isRetryableError) {
        throw error;
      }
      
      const delayMs = Math.min(
        options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1),
        options.maxDelayMs
      );
      
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`, {
        error: error.message,
        attempt,
        nextDelayMs: delayMs
      });
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError!;
}