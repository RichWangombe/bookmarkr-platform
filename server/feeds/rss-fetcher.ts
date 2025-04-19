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

// Create a new RSS parser instance
const parser = new Parser<{}, ExtendedItem>({
  headers: {
    'User-Agent': 'BookmarkrNews/1.0 (https://example.com)'
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded']
    ]
  }
});

/**
 * Fetches and parses an RSS feed from a given URL
 */
export async function fetchRssFeed(source: NewsFeedSource): Promise<NewsItem[]> {
  if (!source.rssUrl) {
    console.error(`No RSS URL provided for source: ${source.name}`);
    return [];
  }
  
  try {
    const feed = await parser.parseURL(source.rssUrl);
    
    return feed.items.map(item => {
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
        const bestMatch = imgMatches.find(match => {
          const url = match[1];
          // Skip tiny icons, common tracking pixels, etc.
          return !/icon|logo|badge|avatar|pixel|tracking|\.gif$|1x1|\.svg/i.test(url) &&
                 !/width=["']?\d{1,2}["']?/i.test(match[0]) &&
                 !/height=["']?\d{1,2}["']?/i.test(match[0]);
        });
        
        if (bestMatch) {
          imageUrl = bestMatch[1];
        } else if (imgMatches.length > 0) {
          // Fall back to first image if no good match
          imageUrl = imgMatches[0][1];
        }
      } else if (item.content) {
        // Try content field if content:encoded is missing
        const imgMatches = Array.from(
          (item.content || '').matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)
        );
        
        if (imgMatches.length > 0) {
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