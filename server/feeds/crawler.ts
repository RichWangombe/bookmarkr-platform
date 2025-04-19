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
 * Crawls articles from a website without RSS
 */
export async function crawlWebsite(source: NewsFeedSource): Promise<NewsItem[]> {
  if (!source.crawlSelector) {
    console.error(`No CSS selector provided for crawling source: ${source.name}`);
    return [];
  }
  
  try {
    const response = await axios.get(source.websiteUrl, {
      headers: {
        'User-Agent': 'BookmarkrNews/1.0 (https://example.com)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles: NewsItem[] = [];
    
    // Find all article elements using the provided selector
    $(source.crawlSelector).each((i, element) => {
      // Limit to recent articles (prevent overloading)
      if (i >= 10) return;
      
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
      
      // Find image element
      let imageUrl: string | undefined;
      const imgElement = $(element).find('img').first();
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
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