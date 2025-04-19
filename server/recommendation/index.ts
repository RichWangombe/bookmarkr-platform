import { BookmarkWithTags } from '@shared/schema';
import natural from 'natural';
import stringSimilarity from 'string-similarity';
import nlp from 'compromise';
import { NewsItem } from '../feeds/rss-fetcher';
import { getAllNews, getTrendingNews, getNewsByCategory } from '../feeds/aggregator';
import { storage } from '../storage';
import { log } from '../vite';

// Initialize Natural NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const tfidf = new natural.TfIdf();

// TF-IDF document index counter
let docCount = 0;

// Interface for recommendations
export interface Recommendation {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string | null;
  imageUrl?: string | null;
  source: string;
  readTime: string;
  type: 'article' | 'video' | 'podcast';
  relevanceScore?: number;
  category?: string;
}

/**
 * Convert a news item to a recommendation format
 */
function convertNewsToRecommendation(newsItem: NewsItem, score?: number): Recommendation {
  // Estimate reading time based on content length (rough estimate)
  const contentLength = (newsItem.content?.length || 0) + newsItem.description.length;
  const wordsCount = contentLength / 5; // Rough estimate of average word length
  const readTimeMinutes = Math.max(2, Math.ceil(wordsCount / 200)); // Assume 200 words per minute
  
  return {
    id: parseInt(newsItem.id.split('-')[1], 10) || Math.floor(Math.random() * 10000),
    title: newsItem.title,
    description: newsItem.description,
    url: newsItem.url,
    thumbnailUrl: newsItem.imageUrl || null,
    imageUrl: newsItem.imageUrl || null,
    source: newsItem.source.name,
    readTime: `${readTimeMinutes} min read`,
    type: 'article',
    relevanceScore: score,
    category: newsItem.category
  };
}

/**
 * Extract key terms from text with frequency analysis
 */
function extractKeyTerms(text: string, maxTerms: number = 10): string[] {
  if (!text) return [];
  
  // Process with NLP to extract entities and nouns
  const doc = nlp(text);
  const entities = doc.topics().json().map((t: any) => t.text.toLowerCase());
  const nouns = doc.nouns().json().map((n: any) => n.text.toLowerCase());
  
  // Get all tokens and stem them
  const tokens = tokenizer.tokenize(text.toLowerCase())
    .filter(token => token.length > 2) // Filter out short tokens
    .map(token => stemmer.stem(token));
  
  // Count token frequencies
  const tokenCounts = new Map<string, number>();
  
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
  }
  
  // Add more weight to entities and nouns
  for (const entity of entities) {
    const stemmed = stemmer.stem(entity);
    tokenCounts.set(stemmed, (tokenCounts.get(stemmed) || 0) + 3); // Higher weight for entities
  }
  
  for (const noun of nouns) {
    const stemmed = stemmer.stem(noun);
    tokenCounts.set(stemmed, (tokenCounts.get(stemmed) || 0) + 2); // Higher weight for nouns
  }
  
  // Sort by frequency and take top terms
  const sortedTokens = Array.from(tokenCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([token]) => token);
    
  return sortedTokens;
}

/**
 * Build user profile based on their bookmarks and tags
 */
async function buildUserProfile(): Promise<{
  terms: string[],
  tags: string[],
  categories: Set<string>,
  sources: Set<string>
}> {
  const bookmarks = await storage.getAllBookmarks();
  
  // Initialize the profile components
  const terms: string[] = [];
  const tagSet = new Set<string>();
  const categories = new Set<string>();
  const sources = new Set<string>();
  
  // Process each bookmark to build the profile
  for (const bookmark of bookmarks) {
    // Extract terms from title and description
    const titleTerms = extractKeyTerms(bookmark.title, 5);
    const descriptionTerms = extractKeyTerms(bookmark.description || '', 10);
    
    // Add all terms
    terms.push(...titleTerms, ...descriptionTerms);
    
    // Add tags
    for (const tag of bookmark.tags) {
      tagSet.add(tag.name.toLowerCase());
    }
    
    // Add category if available
    if (bookmark.category) {
      categories.add(bookmark.category.toLowerCase());
    }
    
    // Add source if available
    if (bookmark.source?.name) {
      sources.add(bookmark.source.name.toLowerCase());
    } else if (bookmark.domain) {
      sources.add(bookmark.domain.toLowerCase());
    }
  }
  
  // Convert tag set to array
  const tags = Array.from(tagSet);
  
  return { terms, tags, categories, sources };
}

/**
 * Calculate relevance score for a news item compared to user profile
 */
function calculateRelevanceScore(
  newsItem: NewsItem, 
  userProfile: { terms: string[], tags: string[], categories: Set<string>, sources: Set<string> }
): number {
  let score = 0;
  
  // Extract terms from news item
  const titleTerms = extractKeyTerms(newsItem.title, 5);
  const descriptionTerms = extractKeyTerms(newsItem.description, 10);
  const itemTerms = [...titleTerms, ...descriptionTerms];
  
  // Term matching
  for (const term of itemTerms) {
    if (userProfile.terms.includes(term)) {
      score += 2;
    }
  }
  
  // Tag matching
  if (newsItem.tags) {
    for (const tag of newsItem.tags) {
      if (userProfile.tags.includes(tag.toLowerCase())) {
        score += 5;
      }
    }
  }
  
  // Category matching
  if (newsItem.category && userProfile.categories.has(newsItem.category.toLowerCase())) {
    score += 10;
  }
  
  // Source matching
  if (userProfile.sources.has(newsItem.source.name.toLowerCase())) {
    score += 7;
  }
  
  // Recency bonus (up to 5 points for very recent items)
  const now = new Date();
  const pubDate = new Date(newsItem.publishedAt);
  const hoursDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    score += 5 * (1 - hoursDiff / 24); // Linear decay over 24 hours
  }
  
  return score;
}

/**
 * Calculate content similarity between two pieces of text
 */
function calculateContentSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Use string similarity for a quick comparison
  return stringSimilarity.compareTwoStrings(text1, text2);
}

/**
 * Get personalized recommendations based on user bookmarks and browsing history
 */
export async function getPersonalizedRecommendations(limit: number = 10): Promise<Recommendation[]> {
  try {
    log('Generating personalized recommendations', 'recommendations');
    
    // Fetch news content to recommend from
    const news = await getAllNews();
    const trendingNews = await getTrendingNews(Math.min(limit, 5));
    
    // Combine news sources (prioritize trending)
    let candidateNews = [...trendingNews];
    
    // Add other news that aren't in trending
    for (const item of news) {
      if (!candidateNews.some(n => n.id === item.id)) {
        candidateNews.push(item);
      }
      
      // Stop when we have enough candidates
      if (candidateNews.length >= limit * 3) {
        break;
      }
    }
    
    // Build user profile
    const userProfile = await buildUserProfile();
    
    // If user has no bookmarks, provide trending news
    if (userProfile.terms.length === 0 && userProfile.tags.length === 0) {
      return trendingNews.slice(0, limit).map(item => convertNewsToRecommendation(item));
    }
    
    // Score each candidate
    const scoredCandidates = candidateNews.map(item => {
      const score = calculateRelevanceScore(item, userProfile);
      return { item, score };
    });
    
    // Sort by score (descending)
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    // Deduplicate by content similarity
    const deduplicatedCandidates: typeof scoredCandidates = [];
    
    for (const candidate of scoredCandidates) {
      // Check if it's too similar to any already selected item
      const isDuplicate = deduplicatedCandidates.some(existing => {
        const titleSimilarity = calculateContentSimilarity(
          existing.item.title,
          candidate.item.title
        );
        
        return titleSimilarity > 0.7; // 70% similarity threshold
      });
      
      if (!isDuplicate) {
        deduplicatedCandidates.push(candidate);
      }
      
      // Stop when we have enough recommendations
      if (deduplicatedCandidates.length >= limit) {
        break;
      }
    }
    
    // Convert to recommendation format
    return deduplicatedCandidates
      .slice(0, limit)
      .map(({ item, score }) => convertNewsToRecommendation(item, score));
    
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    
    // Fallback to trending news in case of error
    try {
      const trendingNews = await getTrendingNews(limit);
      return trendingNews.map(item => convertNewsToRecommendation(item));
    } catch (e) {
      console.error('Failed to get fallback recommendations:', e);
      return [];
    }
  }
}

/**
 * Get recommendations similar to a specific bookmark
 */
export async function getSimilarContent(bookmarkId: number, limit: number = 5): Promise<Recommendation[]> {
  try {
    const bookmark = await storage.getBookmarkById(bookmarkId);
    
    if (!bookmark) {
      throw new Error(`Bookmark with ID ${bookmarkId} not found`);
    }
    
    // Get category-specific content if bookmark has a category
    let candidateNews: NewsItem[] = [];
    
    if (bookmark.category) {
      // Try to get news from the same category
      const categoryNews = await getNewsByCategory(bookmark.category);
      candidateNews = [...categoryNews];
    }
    
    // If we don't have enough candidates, get more from all news
    if (candidateNews.length < limit * 2) {
      const allNews = await getAllNews();
      
      // Add news items that aren't already in candidates
      for (const item of allNews) {
        if (!candidateNews.some(n => n.id === item.id)) {
          candidateNews.push(item);
        }
        
        // Stop when we have enough candidates
        if (candidateNews.length >= limit * 3) {
          break;
        }
      }
    }
    
    // Create a text representation of the bookmark
    const bookmarkText = `${bookmark.title} ${bookmark.description || ''} ${bookmark.tags.map(t => t.name).join(' ')}`;
    
    // Score each candidate based on similarity to the bookmark
    const scoredCandidates = candidateNews.map(item => {
      const itemText = `${item.title} ${item.description} ${item.tags?.join(' ') || ''}`;
      const similarity = calculateContentSimilarity(bookmarkText, itemText);
      
      // Boost score if categories match
      let score = similarity * 100; // Scale to 0-100
      
      if (bookmark.category && item.category && 
          bookmark.category.toLowerCase() === item.category.toLowerCase()) {
        score += 20;
      }
      
      return { item, score };
    });
    
    // Sort by score (descending) and take top recommendations
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    // Convert to recommendation format
    return scoredCandidates
      .slice(0, limit)
      .map(({ item, score }) => convertNewsToRecommendation(item, score));
    
  } catch (error) {
    console.error(`Error getting similar content for bookmark ${bookmarkId}:`, error);
    return [];
  }
}

/**
 * Get content based on specific interests or topics
 */
export async function getTopicBasedRecommendations(topic: string, limit: number = 10): Promise<Recommendation[]> {
  try {
    // Normalize topic
    const normalizedTopic = topic.toLowerCase().trim();
    
    // Check if topic matches any category
    const categories = ['technology', 'business', 'design', 'science', 'ai'];
    const matchedCategory = categories.find(c => normalizedTopic.includes(c) || c.includes(normalizedTopic));
    
    if (matchedCategory) {
      // Get news from the matched category
      const categoryNews = await getNewsByCategory(matchedCategory);
      return categoryNews
        .slice(0, limit)
        .map(item => convertNewsToRecommendation(item));
    }
    
    // If no category match, try to find relevant content from all news
    const allNews = await getAllNews();
    
    // Score based on relevance to the topic
    const scoredNews = allNews.map(item => {
      // Check for topic mention in title, description, or tags
      const titleMatch = item.title.toLowerCase().includes(normalizedTopic) ? 10 : 0;
      const descMatch = item.description.toLowerCase().includes(normalizedTopic) ? 5 : 0;
      
      // Check tags for topic match
      let tagMatch = 0;
      if (item.tags) {
        for (const tag of item.tags) {
          if (tag.toLowerCase().includes(normalizedTopic) || 
              normalizedTopic.includes(tag.toLowerCase())) {
            tagMatch += 7;
            break;
          }
        }
      }
      
      const score = titleMatch + descMatch + tagMatch;
      return { item, score };
    });
    
    // Filter to items with some relevance and sort by score
    const relevantNews = scoredNews
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // If we found relevant content, return it
    if (relevantNews.length > 0) {
      return relevantNews.map(({ item }) => convertNewsToRecommendation(item));
    }
    
    // Fallback to trending news
    const trendingNews = await getTrendingNews(limit);
    return trendingNews.map(item => convertNewsToRecommendation(item));
    
  } catch (error) {
    console.error(`Error getting recommendations for topic '${topic}':`, error);
    return [];
  }
}

/**
 * Get a diverse mix of recommendations across different categories
 */
export async function getDiscoveryRecommendations(limit: number = 10): Promise<Recommendation[]> {
  try {
    // Get trending content first
    const trending = await getTrendingNews(Math.floor(limit * 0.3));
    let recommendations: Recommendation[] = trending.map(item => convertNewsToRecommendation(item));
    
    // Get additional content from different categories to ensure diversity
    const categories = ['technology', 'business', 'design', 'science', 'ai'];
    const itemsPerCategory = Math.ceil((limit - recommendations.length) / categories.length);
    
    for (const category of categories) {
      const categoryNews = await getNewsByCategory(category);
      
      // Skip if no news in this category
      if (categoryNews.length === 0) continue;
      
      // Take a random sample
      const randomIndexes = new Set<number>();
      while (randomIndexes.size < itemsPerCategory && randomIndexes.size < categoryNews.length) {
        randomIndexes.add(Math.floor(Math.random() * categoryNews.length));
      }
      
      // Add to recommendations
      const categoryItems = Array.from(randomIndexes).map(index => {
        return convertNewsToRecommendation(categoryNews[index]);
      });
      
      recommendations = [...recommendations, ...categoryItems];
      
      // Stop if we have enough recommendations
      if (recommendations.length >= limit) {
        break;
      }
    }
    
    // Shuffle recommendations to mix categories
    for (let i = recommendations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error getting discovery recommendations:', error);
    return [];
  }
}