// Recommendation interface for the recommendation engine
export interface Recommendation {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string | null;
  imageUrl?: string | null;
  source: string;
  readTime: string;
  type: 'article' | 'video' | 'podcast';
  relevanceScore?: number;
  category?: string;
}