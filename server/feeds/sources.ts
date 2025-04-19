// Sources for news content

export interface NewsFeedSource {
  id: string;
  name: string;
  category: string;
  region: string;
  rssUrl?: string;           // URL for RSS feed if available
  websiteUrl: string;        // Main website URL
  crawlSelector?: string;    // CSS selector for content if crawling needed
  iconUrl?: string;          // Icon/logo URL for the source
  requiresCrawling: boolean; // Whether this source needs web crawling
}

// A collection of diverse news sources with RSS feeds and crawl targets
export const newsSources: NewsFeedSource[] = [
  // Technology Sources
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "technology",
    region: "global",
    rssUrl: "https://techcrunch.com/feed/",
    websiteUrl: "https://techcrunch.com",
    iconUrl: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
    requiresCrawling: false
  },
  {
    id: "theverge",
    name: "The Verge",
    category: "technology",
    region: "global",
    rssUrl: "https://www.theverge.com/rss/index.xml",
    websiteUrl: "https://www.theverge.com",
    iconUrl: "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-64x64.0.png",
    requiresCrawling: false
  },
  {
    id: "wired",
    name: "Wired",
    category: "technology",
    region: "global",
    rssUrl: "https://www.wired.com/feed/rss",
    websiteUrl: "https://www.wired.com",
    iconUrl: "https://www.wired.com/favicon.ico",
    requiresCrawling: false
  },
  
  // Business Sources
  {
    id: "bloomberg",
    name: "Bloomberg",
    category: "business",
    region: "global",
    rssUrl: "https://feeds.bloomberg.com/technology/news.rss",
    websiteUrl: "https://www.bloomberg.com",
    iconUrl: "https://assets.bwbx.io/s3/javelin/public/javelin/images/bloomberg-favicon-black-63e2f517d4.png",
    requiresCrawling: false
  },
  {
    id: "ft",
    name: "Financial Times",
    category: "business",
    region: "global",
    websiteUrl: "https://www.ft.com",
    crawlSelector: "article.article",
    iconUrl: "https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1:brand-ft-logo-square-coloured?source=update-logos&format=png&width=194&height=194",
    requiresCrawling: true
  },
  
  // News Sources
  {
    id: "bbc",
    name: "BBC News",
    category: "news",
    region: "global",
    rssUrl: "http://feeds.bbci.co.uk/news/world/rss.xml",
    websiteUrl: "https://www.bbc.com/news",
    iconUrl: "https://static.files.bbci.co.uk/core/website/assets/static/icons/favicon-32x32.9b9e6c1b.png",
    requiresCrawling: false
  },
  {
    id: "guardian",
    name: "The Guardian",
    category: "news",
    region: "global",
    rssUrl: "https://www.theguardian.com/international/rss",
    websiteUrl: "https://www.theguardian.com",
    iconUrl: "https://assets.guim.co.uk/images/favicons/3307acfea72ccea2a2691d68458ec200/32x32.ico",
    requiresCrawling: false
  },
  {
    id: "reuters",
    name: "Reuters",
    category: "news",
    region: "global",
    rssUrl: "https://www.reutersagency.com/feed/",
    websiteUrl: "https://www.reuters.com",
    iconUrl: "https://www.reuters.com/pf/resources/images/reuters/favicon.ico?d=150",
    requiresCrawling: false
  },
  
  // Science Sources
  {
    id: "sciencedaily",
    name: "Science Daily",
    category: "science",
    region: "global",
    rssUrl: "https://www.sciencedaily.com/rss/all.xml",
    websiteUrl: "https://www.sciencedaily.com",
    iconUrl: "https://www.sciencedaily.com/favicon.ico",
    requiresCrawling: false
  },
  {
    id: "nature",
    name: "Nature",
    category: "science",
    region: "global",
    rssUrl: "http://feeds.nature.com/nature/rss/current",
    websiteUrl: "https://www.nature.com",
    iconUrl: "https://www.nature.com/static/images/favicons/nature/favicon-32x32.png",
    requiresCrawling: false
  },
  
  // Design Sources
  {
    id: "designmilk",
    name: "Design Milk",
    category: "design",
    region: "global",
    rssUrl: "https://design-milk.com/feed/",
    websiteUrl: "https://design-milk.com",
    iconUrl: "https://design-milk.com/images/favicon.ico",
    requiresCrawling: false
  },
  {
    id: "awwwards",
    name: "Awwwards",
    category: "design",
    region: "global",
    websiteUrl: "https://www.awwwards.com",
    crawlSelector: ".inspiration-item",
    iconUrl: "https://www.awwwards.com/favicon.ico",
    requiresCrawling: true
  },
  
  // AI & ML Sources
  {
    id: "deepmind",
    name: "DeepMind Blog",
    category: "ai",
    region: "global",
    websiteUrl: "https://deepmind.com/blog",
    crawlSelector: "article.dm-c-article-item",
    iconUrl: "https://storage.googleapis.com/deepmind-web/favicon-32x32.png",
    requiresCrawling: true
  },
  {
    id: "openai",
    name: "OpenAI Blog",
    category: "ai",
    region: "global",
    websiteUrl: "https://openai.com/blog",
    crawlSelector: "article",
    iconUrl: "https://openai.com/favicon.ico",
    requiresCrawling: true
  }
];

// Helper functions to work with sources
export function getSourcesByCategory(category: string): NewsFeedSource[] {
  return newsSources.filter(source => source.category === category);
}

export function getRssSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.rssUrl);
}

export function getCrawlSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.requiresCrawling);
}