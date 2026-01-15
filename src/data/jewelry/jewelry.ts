/**
 * Jewelry type definitions for Virtual Jewelry Try-On feature
 */

export interface JewelryStyle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  priceValue: number;      // Price in cents (e.g., 38500 = $385.00)
  priceSymbol: string;     // Currency symbol (e.g., "$")
  category: string;        // necklace, earring, ring, bracelet
  tags: string[];
  popularity: number;      // Popularity score (0-100)
}

export type JewelryCategory = 'all' | 'necklace' | 'earring' | 'ring' | 'bracelet';
