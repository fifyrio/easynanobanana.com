export const PAID_VIDEO_TRIALS: Record<string, { price: number; days: number; credits: number }> = {
  'Basic Monthly': { price: 0.99, days: 1, credits: 100 },
  'Max Monthly': { price: 1.99, days: 3, credits: 200 },
};

export function availableTrialCredits(trial: { remaining_credits: number; expires_at: string } | null | undefined): number {
  return trial && Date.parse(trial.expires_at) > Date.now() ? trial.remaining_credits : 0;
}
