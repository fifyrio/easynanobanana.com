// TypeScript type definitions for Prompt History feature

export interface PromptFolder {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface SavedPrompt {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  prompt_text: string;
  tags: string[];
  thumbnail_url: string | null;
  last_image_id: string | null;
  created_at: string;
}

export interface CreateFolderInput {
  name: string;
  icon?: string;
}

export interface UpdateFolderInput {
  name?: string;
  icon?: string;
  sort_order?: number;
}

export interface CreatePromptInput {
  title: string;
  prompt_text: string;
  folder_id?: string | null;
  tags?: string[];
  thumbnail_url?: string;
  last_image_id?: string;
}

export interface UpdatePromptInput {
  title?: string;
  prompt_text?: string;
  folder_id?: string | null;
  tags?: string[];
  thumbnail_url?: string;
  last_image_id?: string;
}
