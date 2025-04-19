import Parser from 'rss-parser';
import { NewsFeedSource, getRssSources } from './sources';
import axios from 'axios';

// Define the structure of a normalized news item
export interface NewsItem {
  id: string;          // Unique identifier
  title: string;       // Article title
  description: string; // Short description or excerpt
  content?: string;    // Full content if available
  url: string;         // Original article URL
  imageUrl?: string;   // Featured image URL
  publishedAt: Date;   // Publication date
  source: {
    id: string;
    name: string;
    iconUrl?: string;
  };
  category: string;    // Primary category
  tags?: string[];     // Associated tags
}

// Extended interface for RSS items with additional fields we need
interface ExtendedItem {
  // Standard fields from rss-parser
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  
  // Custom fields from RSS feeds
  media?: { $?: { url?: string } };
  thumbnail?: { $?: { url?: string } };
  enclosure?: { url?: string };
  'content:encoded'?: string;
  description?: string;
}

// Create a new RSS parser instance with more browser-like headers
const parser = new Parser<{}, ExtendedItem>({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0'
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded']
    ]
  },
  timeout: 10000, // Increase timeout for slower feeds
});

/**
 * Helper function to delay execution - used for retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try to fetch the RSS feed with retries
 */
async function tryFetchRss(url: string, retries = 2): Promise<any> {
  try {
    return await parser.parseURL(url);
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Exponential backoff: wait longer between each retry
    const backoffTime = 1000 * Math.pow(2, 3 - retries);
    console.log(`Retrying RSS fetch in ${backoffTime}ms...`);
    await delay(backoffTime);
    return tryFetchRss(url, retries - 1);
  }
}

/**
 * Fetches and parses an RSS feed from a given URL with improved error handling
 */
export async function fetchRssFeed(source: NewsFeedSource): Promise<NewsItem[]> {
  if (!source.rssUrl) {
    console.error(`No RSS URL provided for source: ${source.name}`);
    return [];
  }
  
  try {
    // Try using rss-parser first with retries
    let feed;
    try {
      feed = await tryFetchRss(source.rssUrl);
    } catch (rssError) {
      // If RSS parsing fails, try fetching with axios and manually parsing
      console.log(`RSS parser failed for ${source.name}, trying alternative fetch method...`);
      try {
        const response = await axios.get(source.rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 15000
        });
        
        // Try to parse the XML response
        feed = await parser.parseString(response.data);
      } catch (axiosError) {
        console.error(`Alternative fetch method also failed for ${source.name}`);
        throw rssError; // Re-throw the original error
      }
    }
    
    return feed.items.map((item: ExtendedItem) => {
      // Extract image from various possible RSS formats
      let imageUrl: string | undefined;
      
      if (item.media && item.media.$ && item.media.$.url) {
        imageUrl = item.media.$.url;
      } else if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
        imageUrl = item.thumbnail.$.url;
      } else if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      } else if (item['content:encoded']) {
        // Try to extract image from HTML content, prioritizing larger images
        const imgMatches = Array.from(
          (item['content:encoded'] || '').matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)
        );
        
        // Find the first image that's not an icon or tiny image (by looking at URL patterns)
        const bestMatch = imgMatches.find((match: RegExpMatchArray) => {
          const url = match[1];
          // Skip tiny icons, common tracking pixels, etc.
          return url && 
                 !/icon|logo|badge|avatar|pixel|tracking|\.gif$|1x1|\.svg/i.test(url) &&
                 !/width=["']?\d{1,2}["']?/i.test(match[0]) &&
                 !/height=["']?\d{1,2}["']?/i.test(match[0]);
        });
        
        if (bestMatch && bestMatch[1]) {
          imageUrl = bestMatch[1];
        } else if (imgMatches.length > 0 && imgMatches[0][1]) {
          // Fall back to first image if no good match
          imageUrl = imgMatches[0][1];
        }
      } else if (item.content) {
        // Try content field if content:encoded is missing
        const imgMatches = Array.from(
          (item.content || '').matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)
        );
        
        if (imgMatches.length > 0 && imgMatches[0] && imgMatches[0][1]) {
          imageUrl = imgMatches[0][1]; 
        }
      }
      
      // Create a unique ID using the source and link
      const id = `${source.id}-${Buffer.from(item.link || '').toString('base64').substring(0, 10)}`;
      
      return {
        id,
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.description || '',
        content: item.content || item['content:encoded'] || '',
        url: item.link || '',
        imageUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: {
          id: source.id,
          name: source.name,
          iconUrl: source.iconUrl
        },
        category: source.category
      };
    });
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Fetches news from all RSS sources
 */
export async function fetchAllRssNews(): Promise<NewsItem[]> {
  const rssSources = getRssSources();
  const allNewsPromises = rssSources.map(source => fetchRssFeed(source));
  
  const results = await Promise.allSettled(allNewsPromises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
    .flatMap(result => result.value);
}

/**
 * Fetches news from RSS sources in a specific category
 */
export async function fetchNewsByCategory(category: string): Promise<NewsItem[]> {
  const rssSources = getRssSources().filter(source => source.category === category);
  const allNewsPromises = rssSources.map(source => fetchRssFeed(source));
  
  const results = await Promise.allSettled(allNewsPromises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
    .flatMap(result => result.value);
}