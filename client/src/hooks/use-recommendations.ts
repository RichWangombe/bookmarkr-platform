import { useQuery } from "@tanstack/react-query";
import { Recommendation } from "../types/recommendations";

// Hook for fetching personalized recommendations
export function usePersonalizedRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/recommendations/personalized', limit],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/personalized?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch personalized recommendations');
      }
      const data = await response.json();
      return data as Recommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching similar content recommendations
export function useSimilarContent(bookmarkId: number, limit: number = 5) {
  return useQuery({
    queryKey: ['/api/recommendations/similar', bookmarkId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/similar/${bookmarkId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch similar content for bookmark ${bookmarkId}`);
      }
      const data = await response.json();
      return data as Recommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!bookmarkId, // Only enable the query if bookmarkId is provided
  });
}

// Hook for fetching topic-based recommendations
export function useTopicRecommendations(topic: string, limit: number = 10) {
  return useQuery({
    queryKey: ['/api/recommendations/topic', topic, limit],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/topic/${encodeURIComponent(topic)}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topic recommendations for "${topic}"`);
      }
      const data = await response.json();
      return data as Recommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!topic, // Only enable the query if topic is provided
  });
}

// Hook for fetching discovery recommendations
export function useDiscoveryRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/recommendations/discover', limit],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/discover?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch discovery recommendations');
      }
      const data = await response.json();
      return data as Recommendation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}