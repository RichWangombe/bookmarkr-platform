import { fetchAllRssNews, fetchNewsByCategory, NewsItem } from './rss-fetcher';
import { crawlAllSources, crawlByCategory } from './crawler';
import { fetchFromApis, searchFromApis } from './api-service';
import { fetchFromSocialPlatforms } from './social-service';

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
 * Also enhances items with fallback images if needed
 */
function combineAndDeduplicate(items1: NewsItem[], items2: NewsItem[]): NewsItem[] {
  const combined = [...items1, ...items2];
  const uniqueMap = new Map<string, NewsItem>();
  
  // Use Map to deduplicate by ID
  combined.forEach(item => {
    // Add fallback image if the item doesn't have one
    if (!item.imageUrl) {
      item.imageUrl = getFallbackImage(item.category, item.title);
    }
    
    // Fix relative image URLs
    if (item.imageUrl && item.imageUrl.startsWith('/')) {
      try {
        const urlObj = new URL(item.url);
        item.imageUrl = `${urlObj.protocol}//${urlObj.host}${item.imageUrl}`;
      } catch (e) {
        // Keep original if URL parsing fails
      }
    }
    
    uniqueMap.set(item.id, item);
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Provides a fallback image URL based on the content category and title
 */
function getFallbackImage(category: string, title: string): string {
  // Base set of high-quality fallback images by category
  const fallbackImages: Record<string, string[]> = {
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
    ],
    business: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72'
    ],
    design: [
      'https://images.unsplash.com/photo-1561069934-eee225952461',
      'https://images.unsplash.com/photo-1523726491678-bf852e717f6a',
      'https://images.unsplash.com/photo-1618004912476-29818d81ae2e'
    ],
    science: [
      'https://images.unsplash.com/photo-1564325724739-bae0bd08762c',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074'
    ],
    ai: [
      'https://images.unsplash.com/photo-1677442135073-d853d01457a9',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
      'https://images.unsplash.com/photo-1620330009516-5fcf8c2000c9'
    ],
    news: [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
      'https://images.unsplash.com/photo-1495020689067-958852a7765e',
      'https://images.unsplash.com/photo-1528747045269-390fe33c19f2'
    ]
  };
  
  // Default category if not found
  const defaultCategory = 'news';
  
  // Get the appropriate list of images
  const imageList = fallbackImages[category] || fallbackImages[defaultCategory];
  
  // Use title to pick a consistent image from the list
  const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = titleHash % imageList.length;
  
  return imageList[index];
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
 * Gets all news from all sources (RSS, crawler, APIs, social)
 * Uses caching to prevent repeated fetches within the TTL
 */
export async function getAllNews(): Promise<NewsItem[]> {
  // Return cached data if it's still fresh
  if (!isCacheStale(newsCache.lastUpdated)) {
    return newsCache.items;
  }
  
  try {
    // Fetch from all sources in parallel
    const [rssNews, crawledNews, apiNews, socialNews] = await Promise.all([
      fetchAllRssNews(),
      crawlAllSources(),
      fetchFromApis(),
      fetchFromSocialPlatforms()
    ]);
    
    // Combine all sources with deduplication
    let combined = combineAndDeduplicate(rssNews, crawledNews);
    combined = combineAndDeduplicate(combined, apiNews);
    combined = combineAndDeduplicate(combined, socialNews);
    
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
 * Gets news for a specific category from all sources (RSS, crawler, APIs, social)
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
    // Fetch from all sources in parallel
    const [rssNews, crawledNews, apiNews, socialNews] = await Promise.all([
      fetchNewsByCategory(category),
      crawlByCategory(category),
      fetchFromApis(category),
      fetchFromSocialPlatforms(category)
    ]);
    
    // Combine all sources with deduplication
    let combined = combineAndDeduplicate(rssNews, crawledNews);
    combined = combineAndDeduplicate(combined, apiNews);
    combined = combineAndDeduplicate(combined, socialNews);
    
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