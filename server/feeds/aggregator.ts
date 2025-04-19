import { fetchAllRssNews, fetchNewsByCategory, NewsItem } from './rss-fetcher';
import { crawlAllSources, crawlByCategory } from './crawler';

// In-memory cache to avoid hitting the same sources repeatedly
let newsCache: {
  items: NewsItem[];
  lastUpdated: Date;
  categories: Record<string, { items: NewsItem[], lastUpdated: Date }>;
} = {
  items: [],
  lastUpdated: new Date(0), // Start with epoch time to force initial fetch
  categories: {}
};

// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Determines if the cache for a given key needs refreshing
 */
function isCacheStale(timestamp: Date): boolean {
  return (Date.now() - timestamp.getTime()) > CACHE_TTL;
}

/**
 * Combines and deduplicates news items from multiple sources
 */
function combineAndDeduplicate(items1: NewsItem[], items2: NewsItem[]): NewsItem[] {
  const combined = [...items1, ...items2];
  const uniqueMap = new Map<string, NewsItem>();
  
  // Use Map to deduplicate by ID
  combined.forEach(item => {
    uniqueMap.set(item.id, item);
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Sort news items by recency
 */
function sortByRecency(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => 
    b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

/**
 * Gets all news from both RSS and crawler sources
 * Uses caching to prevent repeated fetches within the TTL
 */
export async function getAllNews(): Promise<NewsItem[]> {
  // Return cached data if it's still fresh
  if (!isCacheStale(newsCache.lastUpdated)) {
    return newsCache.items;
  }
  
  try {
    // Fetch from both sources in parallel
    const [rssNews, crawledNews] = await Promise.all([
      fetchAllRssNews(),
      crawlAllSources()
    ]);
    
    // Combine, deduplicate, and sort
    const combined = combineAndDeduplicate(rssNews, crawledNews);
    const sorted = sortByRecency(combined);
    
    // Update cache
    newsCache.items = sorted;
    newsCache.lastUpdated = new Date();
    
    return sorted;
  } catch (error) {
    console.error('Error aggregating news:', error);
    
    // Return stale cache on error, even if it's expired
    return newsCache.items;
  }
}

/**
 * Gets news for a specific category from both RSS and crawler sources
 * Uses caching to prevent repeated fetches within the TTL
 */
export async function getNewsByCategory(category: string): Promise<NewsItem[]> {
  // Initialize category cache if it doesn't exist
  if (!newsCache.categories[category]) {
    newsCache.categories[category] = {
      items: [],
      lastUpdated: new Date(0)
    };
  }
  
  const categoryCache = newsCache.categories[category];
  
  // Return cached data if it's still fresh
  if (!isCacheStale(categoryCache.lastUpdated)) {
    return categoryCache.items;
  }
  
  try {
    // Fetch from both sources in parallel
    const [rssNews, crawledNews] = await Promise.all([
      fetchNewsByCategory(category),
      crawlByCategory(category)
    ]);
    
    // Combine, deduplicate, and sort
    const combined = combineAndDeduplicate(rssNews, crawledNews);
    const sorted = sortByRecency(combined);
    
    // Update category cache
    categoryCache.items = sorted;
    categoryCache.lastUpdated = new Date();
    
    return sorted;
  } catch (error) {
    console.error(`Error aggregating ${category} news:`, error);
    
    // Return stale cache on error, even if it's expired
    return categoryCache.items;
  }
}

/**
 * Gets trending/featured articles across categories
 */
export async function getTrendingNews(limit: number = 5): Promise<NewsItem[]> {
  const allNews = await getAllNews();
  
  // For a real implementation, we would apply scoring based on:
  // - Recent publication (already sorted by this)
  // - Source authority (could add a weight to each source)
  // - Content freshness
  // - Social media engagement, etc.
  
  // Here we're just taking the most recent items
  return allNews.slice(0, limit);
}

/**
 * Gets the top news item for each category
 */
export async function getTopNewsByCategory(): Promise<Record<string, NewsItem>> {
  // Define our main categories
  const categories = ['technology', 'business', 'news', 'science', 'design', 'ai'];
  
  // Fetch top news for each category in parallel
  const categoryPromises = categories.map(async category => {
    const news = await getNewsByCategory(category);
    return { category, topItem: news[0] };
  });
  
  const results = await Promise.all(categoryPromises);
  
  // Convert to category-keyed record
  const topNews: Record<string, NewsItem> = {};
  results.forEach(result => {
    if (result.topItem) {
      topNews[result.category] = result.topItem;
    }
  });
  
  return topNews;
}