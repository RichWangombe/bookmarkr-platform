import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsFeedSource, getCrawlSources, markSourceAsFailing, getReliableSources } from './sources';
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
 * With improved anti-blocking measures
 */
async function tryFetchWithRetry(url: string, retries = 2): Promise<any> {
  // Rotate user agents to avoid detection
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  
  // Use a different user agent for each retry
  const userAgent = userAgents[Math.min(retries, userAgents.length - 1)];
  
  try {
    return await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/', // Pretend we're coming from Google
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1'
      },
      timeout: 15000,
      maxRedirects: 5
    });
  } catch (error) {
    if (retries <= 0) throw error;
    
    // More aggressive exponential backoff
    const backoffTime = 2000 * Math.pow(2, 3 - retries);
    console.log(`Retrying fetch for ${new URL(url).hostname} in ${backoffTime}ms...`);
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
    console.log(`Processing crawl batch ${i/batchSize + 1} of ${Math.ceil(sources.length/batchSize)} (${batch.length} sources)`);
    
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
      await delay(2000); // Longer delay for crawling
    }
  }
  
  return results;
}

/**
 * Crawls articles from all configured crawl sources with improved rate limiting
 * Skips consistently failing sources to avoid wasting resources
 */
export async function crawlAllSources(): Promise<NewsItem[]> {
  const allSources = getCrawlSources();
  
  // Filter out consistently failing sources to avoid wasting resources
  const reliableSources = getReliableSources(allSources);
  console.log(`Using ${reliableSources.length} reliable crawl sources out of ${allSources.length} total sources`);
  
  return processBatches(reliableSources, 3, crawlWebsite); // Process 3 sources at a time
}

/**
 * Crawls articles from sources in a specific category with improved rate limiting
 * Skips consistently failing sources to avoid wasting resources
 */
export async function crawlByCategory(category: string): Promise<NewsItem[]> {
  const categorySources = getCrawlSources().filter(source => source.category === category);
  
  // Filter out consistently failing sources to avoid wasting resources
  const reliableSources = getReliableSources(categorySources);
  console.log(`Using ${reliableSources.length} reliable crawl sources out of ${categorySources.length} total sources for category '${category}'`);
  
  return processBatches(reliableSources, 2, crawlWebsite); // Process 2 sources at a time for categories
}