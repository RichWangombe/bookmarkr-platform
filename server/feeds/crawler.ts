import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsFeedSource, getCrawlSources } from './sources';
import { NewsItem } from './rss-fetcher';

/**
 * Extracts basic metadata from HTML content
 */
function extractMetadata(html: string, url: string): { 
  title: string; 
  description: string; 
  image?: string;
  publishedDate?: Date;
} {
  const $ = cheerio.load(html);
  
  // Extract metadata
  const title = $('meta[property="og:title"]').attr('content') || 
                $('meta[name="twitter:title"]').attr('content') || 
                $('title').text() || '';
                
  const description = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="twitter:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || '';
                      
  const image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || 
                undefined;
  
  // Try to extract publication date
  let publishedDate: Date | undefined;
  const publishedStr = $('meta[property="article:published_time"]').attr('content') ||
                      $('time').attr('datetime');
                      
  if (publishedStr) {
    publishedDate = new Date(publishedStr);
  }
  
  return { title, description, image, publishedDate };
}

/**
 * Helper function to delay execution - used for retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try to request a URL with retries and exponential backoff
 */
async function tryFetchWithRetry(url: string, retries = 2): Promise<any> {
  try {
    return await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Exponential backoff
    const backoffTime = 1000 * Math.pow(2, 3 - retries);
    console.log(`Retrying fetch in ${backoffTime}ms...`);
    await delay(backoffTime);
    return tryFetchWithRetry(url, retries - 1);
  }
}

/**
 * Crawls articles from a website without RSS
 */
export async function crawlWebsite(source: NewsFeedSource): Promise<NewsItem[]> {
  if (!source.crawlSelector) {
    console.error(`No CSS selector provided for crawling source: ${source.name}`);
    return [];
  }
  
  try {
    const response = await tryFetchWithRetry(source.websiteUrl);
    
    const $ = cheerio.load(response.data);
    const articles: NewsItem[] = [];
    
    // Find all article elements using the provided selector
    $(source.crawlSelector).each((i, element) => {
      // Limit to recent articles (prevent overloading)
      if (i >= 15) return;
      
      // Extract article URL
      const linkElement = $(element).find('a').first();
      let articleUrl = linkElement.attr('href') || '';
      
      // Handle relative URLs
      if (articleUrl && !articleUrl.startsWith('http')) {
        const baseUrl = new URL(source.websiteUrl);
        articleUrl = articleUrl.startsWith('/') 
          ? `${baseUrl.protocol}//${baseUrl.host}${articleUrl}`
          : `${source.websiteUrl}/${articleUrl}`;
      }
      
      if (!articleUrl) return;
      
      // Extract basic info from the article card
      const title = $(element).find('h1, h2, h3').first().text().trim() || 
                    linkElement.text().trim() || 
                    'Untitled';
                    
      const description = $(element).find('p').first().text().trim() || '';
      
      // Find the best image element (prioritizing larger images, skipping icons)
      let imageUrl: string | undefined;
      
      // Check for Open Graph or Twitter image first
      const ogImage = $('meta[property="og:image"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      
      if (ogImage) {
        imageUrl = ogImage;
      } else if (twitterImage) {
        imageUrl = twitterImage;
      } else {
        // Look for images in the article card
        const allImages = $(element).find('img');
        
        // Try to find a suitable image
        for (let i = 0; i < allImages.length; i++) {
          const img = allImages.eq(i);
          const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          const width = parseInt(img.attr('width') || '0', 10);
          const height = parseInt(img.attr('height') || '0', 10);
          
          // Skip small images, icons, avatars, etc.
          if (src && 
              !/icon|logo|badge|avatar|pixel|tracking|\.gif$|1x1|\.svg/i.test(src) &&
              (width === 0 || width > 100) && 
              (height === 0 || height > 100)) {
            imageUrl = src;
            break;
          }
        }
        
        // If we still don't have an image, just take the first one
        if (!imageUrl && allImages.length > 0) {
          imageUrl = allImages.first().attr('src') || 
                    allImages.first().attr('data-src') || 
                    allImages.first().attr('data-lazy-src');
        }
      }
      
      // Create a unique ID
      const id = `${source.id}-${Buffer.from(articleUrl).toString('base64').substring(0, 10)}`;
      
      articles.push({
        id,
        title,
        description,
        url: articleUrl,
        imageUrl,
        publishedAt: new Date(), // We'll try to get the actual date later
        source: {
          id: source.id,
          name: source.name,
          iconUrl: source.iconUrl
        },
        category: source.category
      });
    });
    
    // Enhance with full article content (first article only to avoid rate limiting)
    if (articles.length > 0) {
      try {
        const firstArticle = articles[0];
        const articleResponse = await axios.get(firstArticle.url, {
          headers: {
            'User-Agent': 'BookmarkrNews/1.0 (https://example.com)'
          }
        });
        
        const metadata = extractMetadata(articleResponse.data, firstArticle.url);
        
        // Update with better metadata if available
        if (metadata.title) firstArticle.title = metadata.title;
        if (metadata.description) firstArticle.description = metadata.description;
        if (metadata.image) firstArticle.imageUrl = metadata.image;
        if (metadata.publishedDate) firstArticle.publishedAt = metadata.publishedDate;
      } catch (error) {
        console.error(`Error fetching article details from ${source.name}:`, error);
      }
    }
    
    return articles;
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error);
    return [];
  }
}

/**
 * Crawls articles from all configured crawl sources
 */
export async function crawlAllSources(): Promise<NewsItem[]> {
  const crawlSources = getCrawlSources();
  const allNewsPromises = crawlSources.map(source => crawlWebsite(source));
  
  const results = await Promise.allSettled(allNewsPromises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
    .flatMap(result => result.value);
}

/**
 * Crawls articles from sources in a specific category
 */
export async function crawlByCategory(category: string): Promise<NewsItem[]> {
  const crawlSources = getCrawlSources().filter(source => source.category === category);
  const allNewsPromises = crawlSources.map(source => crawlWebsite(source));
  
  const results = await Promise.allSettled(allNewsPromises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
    .flatMap(result => result.value);
}