// TypeScript type definitions for Prompt History feature

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  title: string;
  thumbnail_url: string | null;
  image_url: string;
  created_at: string;
  style?: string;
  image_type: string;
}
