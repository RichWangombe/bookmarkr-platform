import Parser from 'rss-parser';
import { NewsFeedSource, getRssSources, markSourceAsFailing, getReliableSources } from './sources';
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
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site'
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded']
    ]
  },
  timeout: 15000, // Increase timeout for slower feeds
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
      
      // Rotate user agents to avoid detection
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      ];
      
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      try {
        // Try with a different approach - using axios with enhanced browser-like headers
        const response = await axios.get(source.rssUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site'
          },
          timeout: 15000,
          maxRedirects: 5
        });
        
        // Try to parse the XML response
        feed = await parser.parseString(response.data);
      } catch (axiosError) {
        // If that also fails, log and re-throw the original error
        console.error(`Alternative fetch method also failed for ${source.name}`);
        throw rssError;
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
    // Mark this source as potentially failing for future reference
    markSourceAsFailing(source.id);
    return [];
  }
}

/**
 * Process sources in batches to avoid overwhelming servers
 * @param sources List of news sources to process
 * @param batchSize Number of sources to process in parallel
 * @param processor Function to process each source
 */
async function processBatches(
  sources: NewsFeedSource[],
  batchSize: number,
  processor: (source: NewsFeedSource) => Promise<NewsItem[]>
): Promise<NewsItem[]> {
  const results: NewsItem[] = [];
  // Process sources in batches to avoid overwhelming the servers
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    console.log(`Processing RSS batch ${i/batchSize + 1} of ${Math.ceil(sources.length/batchSize)} (${batch.length} sources)`);
    
    const batchPromises = batch.map(source => processor(source));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Extract successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    }
    
    // Add a small delay between batches to be gentle on servers
    if (i + batchSize < sources.length) {
      await delay(1000);
    }
  }
  
  return results;
}

/**
 * Fetches news from all RSS sources with improved rate limiting
 * Skips consistently failing sources to avoid wasting resources
 */
export async function fetchAllRssNews(): Promise<NewsItem[]> {
  const allSources = getRssSources();
  
  // Filter out consistently failing sources to avoid wasting resources
  const reliableSources = getReliableSources(allSources);
  console.log(`Using ${reliableSources.length} reliable RSS sources out of ${allSources.length} total sources`);
  
  return processBatches(reliableSources, 5, fetchRssFeed); // Process 5 sources at a time
}

/**
 * Fetches news from RSS sources in a specific category with improved rate limiting
 * Skips consistently failing sources to avoid wasting resources
 */
export async function fetchNewsByCategory(category: string): Promise<NewsItem[]> {
  const categorySources = getRssSources().filter(source => source.category === category);
  
  // Filter out consistently failing sources to avoid wasting resources
  const reliableSources = getReliableSources(categorySources);
  console.log(`Using ${reliableSources.length} reliable RSS sources out of ${categorySources.length} total sources for category '${category}'`);
  
  return processBatches(reliableSources, 3, fetchRssFeed); // Process 3 sources at a time for categories
}