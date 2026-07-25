// TypeScript type definitions for the Assets page

// Media category shown in the sidebar Tools section.
export type AssetKind = 'image' | 'video' | 'audio';

// Sidebar view the user is currently browsing.
export type AssetView = 'all' | 'favorites' | AssetKind;

export interface AssetItem {
  id: string;
  title: string;
  prompt: string | null;
  // Primary media URL: processed image for images, video file for videos.
  media_url: string;
  thumbnail_url: string | null;
  created_at: string;
  // Sub-type label: image_type for images, effect_type for videos.
  subtype: string | null;
  kind: AssetKind;
  is_favorite: boolean;
}

export interface AssetCounts {
  all: number;
  favorites: number;
  image: number;
  video: number;
  audio: number;
}

export interface AssetsResponse {
  success: boolean;
  assets: AssetItem[];
  counts: AssetCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
