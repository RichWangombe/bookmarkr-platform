/**
 * Social Content Aggregation Service
 * Integrates with social platforms like Reddit and Hacker News to fetch trending content
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsItem } from './rss-fetcher';
import { getSocialSources } from './sources';
import { log } from '../vite';

// Cache to store responses
interface CacheItem {
  data: NewsItem[];
  timestamp: Date;
}

// Cache with 30-minute TTL by default (social content changes rapidly)
const socialCache: Record<string, CacheItem> = {};
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches trending posts from Reddit
 * Uses the JSON API which doesn't require authentication for read-only access
 */
async function fetchFromReddit(subreddit: string = 'technology', limit: number = 15): Promise<NewsItem[]> {
  try {
    // Cache key
    const cacheKey = `reddit-${subreddit}`;
    
    // Check cache first
    if (socialCache[cacheKey] && 
        (new Date().getTime() - socialCache[cacheKey].timestamp.getTime() < CACHE_TTL_MS)) {
      return socialCache[cacheKey].data;
    }
    
    // Reddit provides a JSON endpoint that doesn't require authentication
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Bookmarkr/1.0 (educational project)'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.data && response.data.data.children) {
      const items: NewsItem[] = response.data.data.children
        .filter((post: any) => {
          // Filter out pinned posts, self posts without external links, and NSFW content
          return !post.data.stickied && 
                 !post.data.is_self && 
                 !post.data.over_18 &&
                 post.data.post_hint === 'link';
        })
        .map((post: any) => {
          // Create a deterministic ID
          const id = `reddit-${post.data.id}`;
          
          // Determine the category based on subreddit
          let category = 'technology';
          if (subreddit === 'science') category = 'science';
          else if (subreddit === 'business' || subreddit === 'economy') category = 'business';
          else if (subreddit === 'design' || subreddit === 'web_design') category = 'design';
          else if (subreddit === 'MachineLearning' || subreddit === 'artificial') category = 'ai';
          
          return {
            id,
            title: post.data.title,
            description: post.data.selftext || `${post.data.ups} upvotes • ${post.data.num_comments} comments`,
            url: post.data.url,
            imageUrl: post.data.thumbnail !== 'self' && post.data.thumbnail !== 'default' ? 
                     post.data.thumbnail : post.data.preview?.images[0]?.source?.url,
            publishedAt: new Date(post.data.created_utc * 1000),
            source: {
              id: 'reddit',
              name: `Reddit r/${subreddit}`,
              iconUrl: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png'
            },
            category,
            tags: [subreddit, ...generateTagsFromContent(post.data.title)]
          };
        });
      
      // Update cache
      socialCache[cacheKey] = {
        data: items,
        timestamp: new Date()
      };
      
      log(`Fetched ${items.length} posts from Reddit r/${subreddit}`, 'social-service');
      return items;
    }
    
    return [];
  } catch (error) {
    log(`Error fetching from Reddit: ${error}`, 'social-service');
    return [];
  }
}

/**
 * Fetches trending stories from Hacker News
 */
async function fetchFromHackerNews(limit: number = 15): Promise<NewsItem[]> {
  try {
    // Cache key
    const cacheKey = 'hackernews';
    
    // Check cache first
    if (socialCache[cacheKey] && 
        (new Date().getTime() - socialCache[cacheKey].timestamp.getTime() < CACHE_TTL_MS)) {
      return socialCache[cacheKey].data;
    }
    
    // Fetch top story IDs from HN API
    const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const topStories = await axios.get(topStoriesUrl, { timeout: 5000 });
    
    if (!topStories.data || !Array.isArray(topStories.data)) {
      return [];
    }
    
    // Take top N stories
    const storyIds = topStories.data.slice(0, limit);
    
    // Fetch details for each story (in parallel)
    const storyPromises = storyIds.map(id => 
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 5000 })
    );
    
    const stories = await Promise.all(storyPromises);
    
    // Transform to our NewsItem format
    const items: NewsItem[] = stories
      .filter(response => response.data && response.data.url) // Only include stories with URLs
      .map(response => {
        const story = response.data;
        return {
          id: `hackernews-${story.id}`,
          title: story.title,
          description: `${story.score} points • ${story.descendants || 0} comments`,
          url: story.url,
          imageUrl: undefined, // HN doesn't provide thumbnails
          publishedAt: new Date(story.time * 1000),
          source: {
            id: 'hackernews',
            name: 'Hacker News',
            iconUrl: 'https://news.ycombinator.com/favicon.ico'
          },
          category: 'technology',
          tags: ['hackernews', ...generateTagsFromContent(story.title)]
        };
      });
    
    // Since HN doesn't provide thumbnails, try to extract them from the linked pages
    const itemsWithImages = await Promise.all(
      items.map(async item => {
        try {
          // Only try to fetch images for items without thumbnails
          if (!item.imageUrl) {
            const response = await axios.get(item.url, { 
              timeout: 5000,
              headers: { 'User-Agent': 'Bookmarkr/1.0 (educational project)' }
            });
            
            if (response.data) {
              const $ = cheerio.load(response.data);
              
              // Try to get Open Graph image
              let imageUrl = $('meta[property="og:image"]').attr('content');
              
              // If no OG image, try Twitter card image
              if (!imageUrl) {
                imageUrl = $('meta[name="twitter:image"]').attr('content');
              }
              
              // If still no image, try first large image on page
              if (!imageUrl) {
                $('img').each((i, img) => {
                  const src = $(img).attr('src');
                  const width = parseInt($(img).attr('width') || '0');
                  const height = parseInt($(img).attr('height') || '0');
                  
                  if (src && (width > 200 || height > 200) && !imageUrl) {
                    imageUrl = src;
                  }
                });
              }
              
              // If image URL is relative, make it absolute
              if (imageUrl && !imageUrl.startsWith('http')) {
                const baseUrl = new URL(item.url);
                imageUrl = new URL(imageUrl, baseUrl.origin).toString();
              }
              
              item.imageUrl = imageUrl || undefined;
              
              // Try to get description if missing
              if (!item.description || item.description.includes('points')) {
                const metaDesc = $('meta[name="description"]').attr('content') || 
                               $('meta[property="og:description"]').attr('content');
                               
                if (metaDesc) {
                  item.description = metaDesc;
                }
              }
            }
          }
          
          return item;
        } catch (error) {
          // Return the original item if there's an error fetching the page
          return item;
        }
      })
    );
    
    // Update cache
    socialCache[cacheKey] = {
      data: itemsWithImages,
      timestamp: new Date()
    };
    
    log(`Fetched ${itemsWithImages.length} stories from Hacker News`, 'social-service');
    return itemsWithImages;
  } catch (error) {
    log(`Error fetching from Hacker News: ${error}`, 'social-service');
    return [];
  }
}

// Helper function to extract topics and generate tags
function generateTagsFromContent(content: string): string[] {
  // A simple keyword extraction - in production, we would use NLP
  const commonTopics = [
    "technology", "programming", "science", "business", "health", 
    "environment", "ai", "ml", "design", "software", "mobile", 
    "innovation", "startup", "security", "privacy", "finance"
  ];
  
  return commonTopics.filter(topic => 
    content.toLowerCase().includes(topic)
  ).slice(0, 3); // Limit to 3 tags
}

// Public function to fetch social content by category
export async function fetchFromSocialPlatforms(category?: string): Promise<NewsItem[]> {
  const socialSources = getSocialSources();
  
  // Check which platforms are available
  const hasHackerNews = socialSources.find(s => s.id === 'hackernews');
  const hasReddit = socialSources.find(s => s.id === 'reddit-tech');
  
  let results: NewsItem[] = [];
  
  // Map our categories to appropriate subreddits
  let subreddit = 'technology';
  if (category === 'science') subreddit = 'science';
  else if (category === 'business') subreddit = 'business';
  else if (category === 'design') subreddit = 'web_design';
  else if (category === 'ai') subreddit = 'MachineLearning';
  
  // Fetch from Reddit if available and category matches
  if (hasReddit && (!category || category === 'technology' || 
                  category === 'science' || category === 'business' || 
                  category === 'design' || category === 'ai')) {
    const redditPosts = await fetchFromReddit(subreddit);
    results = [...results, ...redditPosts];
  }
  
  // Fetch from Hacker News if available and category is technology or not specified
  if (hasHackerNews && (!category || category === 'technology')) {
    const hnPosts = await fetchFromHackerNews();
    results = [...results, ...hnPosts];
  }
  
  return results;
}