/**
 * API Service for external content providers
 * This module handles integration with various free-tier news APIs with proper attribution
 */

import axios from 'axios';
import { NewsItem } from './rss-fetcher';
import { getApiSources } from './sources';
import { log } from '../vite';

// Cache to store responses and limit API calls
interface CacheItem {
  data: NewsItem[];
  timestamp: Date;
}

// Cache with 1-hour TTL by default
const apiCache: Record<string, CacheItem> = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Handles GNews API (free tier)
async function fetchFromGNews(query?: string, max: number = 10): Promise<NewsItem[]> {
  try {
    // Cache key based on query
    const cacheKey = `gnews-${query || 'top'}`;
    
    // Check cache first
    if (apiCache[cacheKey] && 
        (new Date().getTime() - apiCache[cacheKey].timestamp.getTime() < CACHE_TTL_MS)) {
      return apiCache[cacheKey].data;
    }
    
    // Base URL 
    let apiUrl = 'https://gnews.io/api/v4/';
    
    // API key - free tier has 100 requests/day
    // For proper implementation, we should use environment variables
    // Note that the free tier requires attribution
    const apiKey = process.env.GNEWS_API_KEY;
    
    if (!apiKey) {
      log('No GNEWS_API_KEY found in environment variables', 'api-service');
      return [];
    }
    
    // Determine endpoint based on query
    if (query) {
      apiUrl += `search?q=${encodeURIComponent(query)}`;
    } else {
      apiUrl += 'top-headlines?';
    }
    
    // Add common parameters
    apiUrl += `&token=${apiKey}&lang=en&max=${max}`;
    
    // Fetch data 
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Bookmarkr/1.0 (educational project)'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.articles) {
      // Transform to our standard NewsItem format
      const items: NewsItem[] = response.data.articles.map((article: any) => {
        // Create a deterministic ID
        const id = `gnews-${Buffer.from(article.url).toString('base64').substring(0, 12)}`;
        
        return {
          id,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          imageUrl: article.image,
          publishedAt: new Date(article.publishedDate),
          source: {
            id: 'gnews',
            name: article.source.name,
            iconUrl: 'https://gnews.io/favicon.ico'
          },
          category: determineCategoryFromTags(article.title + ' ' + article.description),
          tags: generateTagsFromContent(article.title + ' ' + article.description)
        };
      });
      
      // Update cache
      apiCache[cacheKey] = {
        data: items,
        timestamp: new Date()
      };
      
      log(`Fetched ${items.length} articles from GNews API`, 'api-service');
      return items;
    }
    
    return [];
  } catch (error) {
    log(`Error fetching from GNews API: ${error}`, 'api-service');
    return [];
  }
}

// Helper function to extract topics and generate tags
function generateTagsFromContent(content: string): string[] {
  // A simple implementation - in production, we would use NLP
  const commonTopics = [
    "technology", "science", "business", "health", "politics", 
    "environment", "ai", "ml", "design", "software", "mobile", 
    "innovation", "startup", "security", "privacy", "finance"
  ];
  
  return commonTopics.filter(topic => 
    content.toLowerCase().includes(topic)
  ).slice(0, 5); // Limit to 5 tags
}

// Helper to determine category 
function determineCategoryFromTags(content: string): string {
  const categoryKeywords: Record<string, string[]> = {
    "technology": ["tech", "software", "app", "digital", "internet", "computer", "AI", "artificial intelligence"],
    "business": ["business", "finance", "market", "economy", "stock", "investment"],
    "science": ["science", "research", "study", "discovery", "space", "physics", "biology"],
    "design": ["design", "UI", "UX", "graphic", "creative", "art", "visual"],
    "ai": ["AI", "artificial intelligence", "machine learning", "neural network", "deep learning", "algorithm"]
  };
  
  const contentLower = content.toLowerCase();
  
  // Check each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => contentLower.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  // Default category
  return "news";
}

export async function fetchFromApis(category?: string): Promise<NewsItem[]> {
  const apiSources = getApiSources();
  
  // Currently we only support GNews
  const gNewsSource = apiSources.find(s => s.id === 'gnews');
  
  if (!gNewsSource) {
    return [];
  }
  
  // If category is specified, use it as a search query
  if (category && category !== 'news') {
    return fetchFromGNews(category);
  }
  
  // Otherwise fetch top headlines
  return fetchFromGNews();
}

export async function searchFromApis(query: string): Promise<NewsItem[]> {
  // Forward the search query to GNews
  return fetchFromGNews(query);
}