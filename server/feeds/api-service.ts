/**
 * API Service for external content providers
 * This module handles integration with various free-tier news APIs with proper attribution
 */

import axios from 'axios';
import { NewsItem } from './rss-fetcher';
import { getApiSources, markSourceAsFailing, getReliableSources } from './sources';
import { log } from '../vite';

// Cache to store responses and limit API calls
interface CacheItem {
  data: NewsItem[];
  timestamp: Date;
}

// Cache with adaptive TTL based on time of day
const apiCache: Record<string, CacheItem> = {};
// Baseline TTL of 1 hour
const BASE_CACHE_TTL_MS = 60 * 60 * 1000; 

// Get TTL based on current time and category - we can be smarter about API usage
// For categories that update less frequently (like science), we can use longer cache TTLs
// During low activity hours (nighttime), we can also increase cache TTL
function getAdaptiveTTL(category?: string): number {
  const now = new Date();
  const hour = now.getHours();
  
  // Default multiplier is 1 (so TTL = BASE_CACHE_TTL_MS)
  let multiplier = 1;
  
  // Categories that update less frequently get longer cache times
  if (category) {
    if (category === 'science' || category === 'design') {
      multiplier *= 1.5; // Science and design content typically updates less frequently
    } else if (category === 'ai') {
      multiplier *= 1.2; // AI content updates somewhat frequently but not as much as news
    }
  }
  
  // During low activity hours (11 PM - 6 AM), extend cache time to save API quota
  if (hour >= 23 || hour < 6) {
    multiplier *= 2;
    log(`Extending cache TTL during low-activity hours (${hour}:00)`, 'api-service');
  }
  
  return Math.floor(BASE_CACHE_TTL_MS * multiplier);
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Handles GNews API (free tier) with improved error handling and rate limiting
async function fetchFromGNews(query?: string, max: number = 10, retries = 2): Promise<NewsItem[]> {
  try {
    // Cache key based on query
    const cacheKey = `gnews-${query || 'top'}`;
    
    // Check cache first - saves API quota
    // Use adaptive TTL based on query/category and time of day
    const cacheTTL = getAdaptiveTTL(query);
    if (apiCache[cacheKey] && 
        (new Date().getTime() - apiCache[cacheKey].timestamp.getTime() < cacheTTL)) {
      log(`Using cached data for GNews query: ${query || 'top headlines'} (TTL: ${Math.round(cacheTTL/60000)} minutes)`, 'api-service');
      return apiCache[cacheKey].data;
    }
    
    // Base URL 
    let apiUrl = 'https://gnews.io/api/v4/';
    
    // API key - free tier has 100 requests/day
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
    
    // Add common parameters - use modern API structure
    apiUrl += `&apikey=${apiKey}&lang=en&max=${max}&country=us,gb,ca,au`;
    
    // Rotate user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Fetch data with better error handling
    try {
      log(`Fetching from GNews API: ${query || 'top headlines'}`, 'api-service');
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.articles && Array.isArray(response.data.articles)) {
        // Transform to our standard NewsItem format
        const items: NewsItem[] = response.data.articles.map((article: any) => {
          // Create a deterministic ID
          const id = `gnews-${Buffer.from(article.url || '').toString('base64').substring(0, 12)}`;
          
          // Ensure we have valid data for each field
          return {
            id,
            title: article.title || 'Untitled Article',
            description: article.description || '',
            content: article.content || article.description || '',
            url: article.url || '',
            imageUrl: article.image || undefined,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
            source: {
              id: 'gnews',
              name: article.source?.name || 'GNews',
              iconUrl: 'https://gnews.io/favicon.ico'
            },
            category: determineCategoryFromTags(article.title + ' ' + article.description),
            tags: generateTagsFromContent(article.title + ' ' + article.description)
          };
        }).filter((item: NewsItem) => item.url && item.title); // Filter out any items missing essential fields
        
        // Update cache
        apiCache[cacheKey] = {
          data: items,
          timestamp: new Date()
        };
        
        log(`Fetched ${items.length} articles from GNews API`, 'api-service');
        return items;
      }
      
      return [];
    } catch (error: any) {
      // Specific error handling for different error types
      if (error.response) {
        // Server responded with error status
        log(`GNews API error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`, 'api-service');
        
        // Handle rate limiting with exponential backoff
        if (error.response.status === 429 && retries > 0) {
          const backoffTime = 2000 * Math.pow(2, 3 - retries);
          log(`Rate limited by GNews API, retrying in ${backoffTime}ms...`, 'api-service');
          await delay(backoffTime);
          return fetchFromGNews(query, max, retries - 1);
        }
      } else if (error.request) {
        // Request made but no response received
        log(`GNews API request timeout or network error: ${error.message}`, 'api-service');
      } else {
        // Error in setting up the request
        log(`GNews API error in request setup: ${error.message}`, 'api-service');
      }
      
      throw error;
    }
  } catch (error) {
    log(`Error fetching from GNews API: ${error}`, 'api-service');
    // Mark GNews as failing if we encounter persistent errors
    markSourceAsFailing('gnews');
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

// Handles NewsAPI (free tier) with error handling and rate limiting
async function fetchFromNewsAPI(query?: string, category?: string, max: number = 20, retries = 2): Promise<NewsItem[]> {
  try {
    // Cache key based on query and category
    const cacheKey = `newsapi-${query || ''}-${category || 'top'}`;
    
    // Check cache first - saves API quota
    const cacheTTL = getAdaptiveTTL(category);
    if (apiCache[cacheKey] && 
        (new Date().getTime() - apiCache[cacheKey].timestamp.getTime() < cacheTTL)) {
      log(`Using cached data for NewsAPI query: ${query || category || 'top headlines'} (TTL: ${Math.round(cacheTTL/60000)} minutes)`, 'api-service');
      return apiCache[cacheKey].data;
    }
    
    // Base URL 
    let apiUrl = 'https://newsapi.org/v2/';
    
    // API key from environment
    const apiKey = process.env.NEWSAPI_KEY;
    
    if (!apiKey) {
      log('No NEWSAPI_KEY found in environment variables', 'api-service');
      return [];
    }
    
    // Determine endpoint based on query
    if (query) {
      // Use 'everything' endpoint for searches
      apiUrl += `everything?q=${encodeURIComponent(query)}`;
      // Add parameters specific to 'everything' endpoint
      apiUrl += `&apiKey=${apiKey}&language=en&pageSize=${max}&sortBy=relevancy`;
    } else {
      // Default to top headlines
      apiUrl += 'top-headlines?';
      // Add parameters specific to 'top-headlines' endpoint
      apiUrl += `apiKey=${apiKey}&language=en&pageSize=${max}&country=us`;
      
      // Add category for top-headlines if specified
      if (category && category !== 'news') {
        apiUrl += `&category=${mapToNewsApiCategory(category)}`;
      }
    }
    
    // Rotate user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Fetch data with better error handling
    try {
      log(`Fetching from NewsAPI: ${query || category || 'top headlines'}`, 'api-service');
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': userAgent,
          'X-Api-Key': apiKey,
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.articles && Array.isArray(response.data.articles)) {
        // Transform to our standard NewsItem format
        const items: NewsItem[] = response.data.articles.map((article: any) => {
          // Create a deterministic ID
          const id = `newsapi-${Buffer.from(article.url || '').toString('base64').substring(0, 12)}`;
          
          return {
            id,
            title: article.title || 'Untitled Article',
            description: article.description || '',
            content: article.content || article.description || '',
            url: article.url || '',
            imageUrl: article.urlToImage || undefined,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
            source: {
              id: 'newsapi',
              name: article.source?.name || 'NewsAPI',
              iconUrl: 'https://newsapi.org/favicon-32x32.png'
            },
            category: determineCategoryFromTags(article.title + ' ' + article.description),
            tags: generateTagsFromContent(article.title + ' ' + article.description)
          };
        }).filter((item: NewsItem) => item.url && item.title); // Filter out any items missing essential fields
        
        // Update cache
        apiCache[cacheKey] = {
          data: items,
          timestamp: new Date()
        };
        
        log(`Fetched ${items.length} articles from NewsAPI`, 'api-service');
        return items;
      }
      
      return [];
    } catch (error: any) {
      // Specific error handling for different error types
      if (error.response) {
        // Server responded with error status
        log(`NewsAPI error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`, 'api-service');
        
        // Handle rate limiting with exponential backoff
        if (error.response.status === 429 && retries > 0) {
          const backoffTime = 2000 * Math.pow(2, 3 - retries);
          log(`Rate limited by NewsAPI, retrying in ${backoffTime}ms...`, 'api-service');
          await delay(backoffTime);
          return fetchFromNewsAPI(query, category, max, retries - 1);
        }
      } else if (error.request) {
        // Request made but no response received
        log(`NewsAPI request timeout or network error: ${error.message}`, 'api-service');
      } else {
        // Error in setting up the request
        log(`NewsAPI error in request setup: ${error.message}`, 'api-service');
      }
      
      throw error;
    }
  } catch (error) {
    log(`Error fetching from NewsAPI: ${error}`, 'api-service');
    // Mark NewsAPI as failing if we encounter persistent errors
    markSourceAsFailing('newsapi');
    return [];
  }
}

// Maps our internal categories to NewsAPI categories
function mapToNewsApiCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'technology': 'technology',
    'business': 'business',
    'science': 'science',
    'design': 'entertainment',
    'ai': 'technology',
    'news': 'general'
  };
  
  return categoryMap[category] || 'general';
}

// Handles MediaStack API with error handling and rate limiting
async function fetchFromMediaStack(query?: string, category?: string, max: number = 20, retries = 2): Promise<NewsItem[]> {
  try {
    // Cache key based on query and category
    const cacheKey = `mediastack-${query || ''}-${category || 'top'}`;
    
    // Check cache first - saves API quota
    const cacheTTL = getAdaptiveTTL(category);
    if (apiCache[cacheKey] && 
        (new Date().getTime() - apiCache[cacheKey].timestamp.getTime() < cacheTTL)) {
      log(`Using cached data for MediaStack query: ${query || category || 'latest news'} (TTL: ${Math.round(cacheTTL/60000)} minutes)`, 'api-service');
      return apiCache[cacheKey].data;
    }
    
    // Base URL 
    let apiUrl = 'http://api.mediastack.com/v1/news?';
    
    // API key from environment
    const apiKey = process.env.MEDIASTACK_KEY;
    
    if (!apiKey) {
      log('No MEDIASTACK_KEY found in environment variables', 'api-service');
      return [];
    }
    
    // Add common parameters
    apiUrl += `access_key=${apiKey}&languages=en&limit=${max}`;
    
    // Add search parameters if query provided
    if (query) {
      apiUrl += `&keywords=${encodeURIComponent(query)}`;
    }
    
    // Add category if specified
    if (category && category !== 'news') {
      apiUrl += `&categories=${mapToMediaStackCategory(category)}`;
    }
    
    // Add sorting - newest first
    apiUrl += '&sort=published_desc';
    
    // Rotate user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Fetch data with better error handling
    try {
      log(`Fetching from MediaStack: ${query || category || 'latest news'}`, 'api-service');
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Transform to our standard NewsItem format
        const items: NewsItem[] = response.data.data.map((article: any) => {
          // Create a deterministic ID
          const id = `mediastack-${Buffer.from(article.url || '').toString('base64').substring(0, 12)}`;
          
          // Extract domain from source URL for icon
          const sourceDomain = article.source ? extractDomain(article.source) : null;
          const iconUrl = sourceDomain ? `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=64` : 'https://mediastack.com/site_images/favicon.ico';
          
          return {
            id,
            title: article.title || 'Untitled Article',
            description: article.description || '',
            content: article.description || '',
            url: article.url || '',
            imageUrl: article.image || undefined,
            publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
            source: {
              id: 'mediastack',
              name: article.source || 'MediaStack',
              iconUrl
            },
            category: article.category || determineCategoryFromTags(article.title + ' ' + (article.description || '')),
            tags: generateTagsFromContent(article.title + ' ' + (article.description || ''))
          };
        }).filter((item: NewsItem) => item.url && item.title); // Filter out any items missing essential fields
        
        // Update cache
        apiCache[cacheKey] = {
          data: items,
          timestamp: new Date()
        };
        
        log(`Fetched ${items.length} articles from MediaStack`, 'api-service');
        return items;
      }
      
      return [];
    } catch (error: any) {
      // Specific error handling for different error types
      if (error.response) {
        // Server responded with error status
        log(`MediaStack error (${error.response.status}): ${error.response.data?.error?.info || 'Unknown error'}`, 'api-service');
        
        // Handle rate limiting with exponential backoff
        if ((error.response.status === 429 || error.response.data?.error?.code === 104) && retries > 0) {
          const backoffTime = 2000 * Math.pow(2, 3 - retries);
          log(`Rate limited by MediaStack, retrying in ${backoffTime}ms...`, 'api-service');
          await delay(backoffTime);
          return fetchFromMediaStack(query, category, max, retries - 1);
        }
      } else if (error.request) {
        // Request made but no response received
        log(`MediaStack request timeout or network error: ${error.message}`, 'api-service');
      } else {
        // Error in setting up the request
        log(`MediaStack error in request setup: ${error.message}`, 'api-service');
      }
      
      throw error;
    }
  } catch (error) {
    log(`Error fetching from MediaStack: ${error}`, 'api-service');
    // Mark MediaStack as failing if we encounter persistent errors
    markSourceAsFailing('mediastack');
    return [];
  }
}

// Helper to extract domain from URL for icon fetching
function extractDomain(url: string): string | null {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    const domain = new URL(url).hostname;
    return domain;
  } catch (e) {
    return null;
  }
}

// Maps our internal categories to MediaStack categories
function mapToMediaStackCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'technology': 'technology',
    'business': 'business',
    'science': 'science',
    'design': 'entertainment',
    'ai': 'technology',
    'news': 'general'
  };
  
  return categoryMap[category] || 'general';
}

export async function fetchFromApis(category?: string): Promise<NewsItem[]> {
  const allApiSources = getApiSources();
  
  // Filter out consistently failing sources
  const reliableSources = getReliableSources(allApiSources);
  log(`Using ${reliableSources.length} reliable API sources out of ${allApiSources.length} total sources`, 'api-service');
  
  let results: NewsItem[] = [];
  const existingUrls = new Set<string>();
  
  // Check for GNews source
  const gNewsSource = reliableSources.find(s => s.id === 'gnews');
  if (gNewsSource) {
    try {
      // If category is specified, use it as a search query for GNews
      if (category && category !== 'news') {
        results = await fetchFromGNews(category);
      } else {
        // Otherwise fetch top headlines
        results = await fetchFromGNews();
      }
      
      // Track URLs for deduplication
      results.forEach(item => existingUrls.add(item.url));
    } catch (error) {
      log(`Error fetching from GNews: ${error}`, 'api-service');
    }
  }
  
  // Check for NewsAPI source
  const newsApiSource = reliableSources.find(s => s.id === 'newsapi');
  if (newsApiSource) {
    try {
      // Use NewsAPI with the category if specified
      const newsApiResults = await fetchFromNewsAPI(undefined, category);
      
      // Combine results, ensuring no duplicates (by URL)
      for (const item of newsApiResults) {
        if (!existingUrls.has(item.url)) {
          results.push(item);
          existingUrls.add(item.url);
        }
      }
    } catch (error) {
      log(`Error fetching from NewsAPI: ${error}`, 'api-service');
    }
  }
  
  // Check for MediaStack source
  const mediaStackSource = reliableSources.find(s => s.id === 'mediastack');
  if (mediaStackSource) {
    try {
      // Use MediaStack with the category if specified
      const mediaStackResults = await fetchFromMediaStack(undefined, category);
      
      // Combine results, ensuring no duplicates (by URL)
      for (const item of mediaStackResults) {
        if (!existingUrls.has(item.url)) {
          results.push(item);
          existingUrls.add(item.url);
        }
      }
    } catch (error) {
      log(`Error fetching from MediaStack: ${error}`, 'api-service');
    }
  }
  
  if (results.length === 0) {
    log('No reliable API sources available or all sources failed', 'api-service');
  }
  
  // Sort combined results by publish date, newest first
  results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  
  return results;
}

export async function searchFromApis(query: string): Promise<NewsItem[]> {
  const allApiSources = getApiSources();
  
  // Filter out consistently failing sources
  const reliableSources = getReliableSources(allApiSources);
  log(`Using ${reliableSources.length} reliable API sources for search out of ${allApiSources.length} total sources`, 'api-service');
  
  let results: NewsItem[] = [];
  const existingUrls = new Set<string>();
  
  // Check for GNews source
  const gNewsSource = reliableSources.find(s => s.id === 'gnews');
  if (gNewsSource) {
    try {
      // Forward the search query to GNews
      results = await fetchFromGNews(query);
      
      // Track URLs for deduplication
      results.forEach(item => existingUrls.add(item.url));
    } catch (error) {
      log(`Error searching with GNews: ${error}`, 'api-service');
    }
  }
  
  // Check for NewsAPI source
  const newsApiSource = reliableSources.find(s => s.id === 'newsapi');
  if (newsApiSource) {
    try {
      // Use NewsAPI search
      const newsApiResults = await fetchFromNewsAPI(query);
      
      // Combine results, ensuring no duplicates (by URL)
      for (const item of newsApiResults) {
        if (!existingUrls.has(item.url)) {
          results.push(item);
          existingUrls.add(item.url);
        }
      }
    } catch (error) {
      log(`Error searching with NewsAPI: ${error}`, 'api-service');
    }
  }
  
  // Check for MediaStack source
  const mediaStackSource = reliableSources.find(s => s.id === 'mediastack');
  if (mediaStackSource) {
    try {
      // Use MediaStack search
      const mediaStackResults = await fetchFromMediaStack(query);
      
      // Combine results, ensuring no duplicates (by URL)
      for (const item of mediaStackResults) {
        if (!existingUrls.has(item.url)) {
          results.push(item);
          existingUrls.add(item.url);
        }
      }
    } catch (error) {
      log(`Error searching with MediaStack: ${error}`, 'api-service');
    }
  }
  
  if (results.length === 0) {
    log('No reliable API sources available for search or all sources failed', 'api-service');
  }
  
  // Sort combined results by publish date, newest first
  results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  
  return results;
}