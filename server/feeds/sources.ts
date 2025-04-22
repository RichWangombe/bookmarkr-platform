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
  type?: 'rss' | 'api' | 'social'; // Type of source for organization
}

// A collection of diverse news sources with RSS feeds and crawl targets
// Track sources that consistently fail to help with future requests
const failingSourcesCache: Record<string, { count: number, lastAttempt: Date }> = {};

// Mark a source as potentially failing
export function markSourceAsFailing(sourceId: string): void {
  const now = new Date();
  if (!failingSourcesCache[sourceId]) {
    failingSourcesCache[sourceId] = { count: 1, lastAttempt: now };
  } else {
    // Increment failure count if within the last 12 hours
    const hoursSinceLastAttempt = (now.getTime() - failingSourcesCache[sourceId].lastAttempt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastAttempt < 12) {
      failingSourcesCache[sourceId].count++;
    } else {
      // Reset if it's been a while (give source another chance after 12 hours)
      failingSourcesCache[sourceId].count = 1;
    }
    
    failingSourcesCache[sourceId].lastAttempt = now;
  }
}

// Check if a source has been consistently failing (3+ consecutive failures)
export function isConsistentlyFailing(sourceId: string): boolean {
  if (!failingSourcesCache[sourceId]) return false;
  
  // Source is considered consistently failing if it failed 3+ times
  return failingSourcesCache[sourceId].count >= 3;
}

// Get a list of reliable sources (excluding consistently failing ones)
export function getReliableSources(sources: NewsFeedSource[]): NewsFeedSource[] {
  return sources.filter(source => !isConsistentlyFailing(source.id));
}

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
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "theverge",
    name: "The Verge",
    category: "technology",
    region: "global",
    rssUrl: "https://www.theverge.com/rss/index.xml",
    websiteUrl: "https://www.theverge.com",
    iconUrl: "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-64x64.0.png",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "wired",
    name: "Wired",
    category: "technology",
    region: "global",
    rssUrl: "https://www.wired.com/feed/rss",
    websiteUrl: "https://www.wired.com",
    iconUrl: "https://www.wired.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "arstechnica",
    name: "Ars Technica",
    category: "technology",
    region: "global",
    rssUrl: "https://feeds.arstechnica.com/arstechnica/index",
    websiteUrl: "https://arstechnica.com",
    iconUrl: "https://cdn.arstechnica.net/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "slashdot",
    name: "Slashdot",
    category: "technology",
    region: "global",
    rssUrl: "http://rss.slashdot.org/Slashdot/slashdotMain",
    websiteUrl: "https://slashdot.org",
    iconUrl: "https://slashdot.org/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "readwriteweb",
    name: "ReadWrite",
    category: "technology",
    region: "global",
    rssUrl: "https://readwrite.com/feed/",
    websiteUrl: "https://readwrite.com",
    iconUrl: "https://readwrite.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "producthunt",
    name: "Product Hunt",
    category: "technology",
    region: "global",
    websiteUrl: "https://www.producthunt.com",
    crawlSelector: ".post-item",
    iconUrl: "https://www.producthunt.com/favicon.ico",
    requiresCrawling: true,
    type: 'rss'
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
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "ft",
    name: "Financial Times",
    category: "business",
    region: "global",
    websiteUrl: "https://www.ft.com",
    crawlSelector: "article.article",
    iconUrl: "https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1:brand-ft-logo-square-coloured?source=update-logos&format=png&width=194&height=194",
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "wsj",
    name: "Wall Street Journal",
    category: "business",
    region: "global",
    rssUrl: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    websiteUrl: "https://www.wsj.com",
    iconUrl: "https://www.wsj.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "economist",
    name: "The Economist",
    category: "business",
    region: "global",
    rssUrl: "https://www.economist.com/business/rss.xml",
    websiteUrl: "https://www.economist.com",
    iconUrl: "https://www.economist.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "fortune",
    name: "Fortune",
    category: "business",
    region: "global",
    rssUrl: "https://fortune.com/feed",
    websiteUrl: "https://fortune.com",
    iconUrl: "https://fortune.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "fastcompany",
    name: "Fast Company",
    category: "business",
    region: "global",
    rssUrl: "https://www.fastcompany.com/feed",
    websiteUrl: "https://www.fastcompany.com",
    iconUrl: "https://www.fastcompany.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
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
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "guardian",
    name: "The Guardian",
    category: "news",
    region: "global",
    rssUrl: "https://www.theguardian.com/international/rss",
    websiteUrl: "https://www.theguardian.com",
    iconUrl: "https://assets.guim.co.uk/images/favicons/3307acfea72ccea2a2691d68458ec200/32x32.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "reuters",
    name: "Reuters",
    category: "news",
    region: "global",
    rssUrl: "https://www.reutersagency.com/feed/",
    websiteUrl: "https://www.reuters.com",
    iconUrl: "https://www.reuters.com/pf/resources/images/reuters/favicon.ico?d=150",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "npr",
    name: "NPR News",
    category: "news",
    region: "us",
    rssUrl: "https://feeds.npr.org/1001/rss.xml",
    websiteUrl: "https://www.npr.org",
    iconUrl: "https://media.npr.org/chrome/npr-favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    category: "news",
    region: "global",
    rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    websiteUrl: "https://www.aljazeera.com",
    iconUrl: "https://www.aljazeera.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "axios",
    name: "Axios",
    category: "news",
    region: "us",
    rssUrl: "https://api.axios.com/feed/",
    websiteUrl: "https://www.axios.com",
    iconUrl: "https://www.axios.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
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
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "nature",
    name: "Nature",
    category: "science",
    region: "global",
    rssUrl: "http://feeds.nature.com/nature/rss/current",
    websiteUrl: "https://www.nature.com",
    iconUrl: "https://www.nature.com/static/images/favicons/nature/favicon-32x32.png",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "scientificamerican",
    name: "Scientific American",
    category: "science",
    region: "global",
    rssUrl: "http://rss.sciam.com/ScientificAmerican-Global",
    websiteUrl: "https://www.scientificamerican.com",
    iconUrl: "https://www.scientificamerican.com/public/resources/favicons/favicon-32x32.png",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "newyorkerkscience",
    name: "New Yorker Science",
    category: "science",
    region: "global",
    rssUrl: "https://www.newyorker.com/feed/tech",
    websiteUrl: "https://www.newyorker.com/science",
    iconUrl: "https://www.newyorker.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "popsci",
    name: "Popular Science",
    category: "science",
    region: "global",
    rssUrl: "https://www.popsci.com/feed/",
    websiteUrl: "https://www.popsci.com",
    iconUrl: "https://www.popsci.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "discover",
    name: "Discover Magazine",
    category: "science",
    region: "global",
    rssUrl: "https://www.discovermagazine.com/rss",
    websiteUrl: "https://www.discovermagazine.com",
    iconUrl: "https://www.discovermagazine.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
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
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "awwwards",
    name: "Awwwards",
    category: "design",
    region: "global",
    websiteUrl: "https://www.awwwards.com",
    crawlSelector: ".inspiration-item",
    iconUrl: "https://www.awwwards.com/favicon.ico",
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "smashingmagazine",
    name: "Smashing Magazine",
    category: "design",
    region: "global",
    rssUrl: "https://www.smashingmagazine.com/feed/",
    websiteUrl: "https://www.smashingmagazine.com",
    iconUrl: "https://www.smashingmagazine.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "creativebloq",
    name: "Creative Bloq",
    category: "design",
    region: "global",
    rssUrl: "https://www.creativebloq.com/feed",
    websiteUrl: "https://www.creativebloq.com",
    iconUrl: "https://www.creativebloq.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "abduzeedo",
    name: "Abduzeedo",
    category: "design",
    region: "global",
    rssUrl: "https://abduzeedo.com/feed",
    websiteUrl: "https://abduzeedo.com",
    iconUrl: "https://abduzeedo.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "dribbble",
    name: "Dribbble",
    category: "design",
    region: "global",
    websiteUrl: "https://dribbble.com/shots",
    crawlSelector: ".shot-thumbnail",
    iconUrl: "https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944bde1a869eb6cd414f4d640ee48ab2a15a26b.ico",
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "behance",
    name: "Behance",
    category: "design",
    region: "global",
    websiteUrl: "https://www.behance.net",
    crawlSelector: ".ProjectCard-cover-1XQCu",
    iconUrl: "https://a5.behance.net/1d51d47c5fbddee7b6a7f7332398aa15e77c9752/img/site/favicon.ico?cb=264615658",
    requiresCrawling: true,
    type: 'rss'
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
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "openai",
    name: "OpenAI Blog",
    category: "ai",
    region: "global",
    websiteUrl: "https://openai.com/blog",
    crawlSelector: "article",
    iconUrl: "https://openai.com/favicon.ico",
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "towardsdatascience",
    name: "Towards Data Science",
    category: "ai",
    region: "global",
    rssUrl: "https://towardsdatascience.com/feed",
    websiteUrl: "https://towardsdatascience.com",
    iconUrl: "https://towardsdatascience.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "googleai",
    name: "Google AI Blog",
    category: "ai",
    region: "global",
    rssUrl: "https://blog.research.google/feeds/posts/default?alt=rss",
    websiteUrl: "https://blog.research.google",
    iconUrl: "https://blog.research.google/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "huggingface",
    name: "Hugging Face Blog",
    category: "ai",
    region: "global",
    rssUrl: "https://huggingface.co/blog/feed.xml",
    websiteUrl: "https://huggingface.co/blog",
    iconUrl: "https://huggingface.co/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "kdnuggets",
    name: "KDnuggets",
    category: "ai",
    region: "global",
    rssUrl: "https://www.kdnuggets.com/feed",
    websiteUrl: "https://www.kdnuggets.com",
    iconUrl: "https://www.kdnuggets.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  
  // Independent & Alternative Media
  {
    id: "intercept",
    name: "The Intercept",
    category: "news",
    region: "global",
    rssUrl: "https://theintercept.com/feed/",
    websiteUrl: "https://theintercept.com",
    iconUrl: "https://theintercept.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "substack",
    name: "Substack Featured",
    category: "news",
    region: "global",
    websiteUrl: "https://substack.com/featured",
    crawlSelector: ".post-preview",
    iconUrl: "https://substack.com/favicon.ico",
    requiresCrawling: true,
    type: 'rss'
  },
  {
    id: "reason",
    name: "Reason",
    category: "news",
    region: "global",
    rssUrl: "https://reason.com/feed/",
    websiteUrl: "https://reason.com",
    iconUrl: "https://reason.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "quillette",
    name: "Quillette",
    category: "news",
    region: "global",
    rssUrl: "https://quillette.com/feed/",
    websiteUrl: "https://quillette.com",
    iconUrl: "https://quillette.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "unherd",
    name: "UnHerd",
    category: "news",
    region: "global",
    rssUrl: "https://unherd.com/feed/",
    websiteUrl: "https://unherd.com",
    iconUrl: "https://unherd.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  {
    id: "zerohedge",
    name: "ZeroHedge",
    category: "business",
    region: "global",
    rssUrl: "https://feeds.feedburner.com/zerohedge/feed",
    websiteUrl: "https://www.zerohedge.com",
    iconUrl: "https://www.zerohedge.com/favicon.ico",
    requiresCrawling: false,
    type: 'rss'
  },
  
  // Social/API Sources (will be used later)
  {
    id: "hackernews",
    name: "Hacker News",
    category: "technology",
    region: "global",
    websiteUrl: "https://news.ycombinator.com",
    iconUrl: "https://news.ycombinator.com/favicon.ico",
    requiresCrawling: true,
    type: 'social'
  },
  {
    id: "reddit-tech",
    name: "Reddit Technology",
    category: "technology",
    region: "global",
    websiteUrl: "https://www.reddit.com/r/technology",
    iconUrl: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    requiresCrawling: true,
    type: 'social'
  },
  {
    id: "reddit-science",
    name: "Reddit Science",
    category: "science",
    region: "global",
    websiteUrl: "https://www.reddit.com/r/science",
    iconUrl: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
    requiresCrawling: true,
    type: 'social'
  },
  {
    id: "gnews",
    name: "GNews API",
    category: "news",
    region: "global",
    websiteUrl: "https://gnews.io/",
    iconUrl: "https://gnews.io/favicon.ico",
    requiresCrawling: false,
    type: 'api'
  }
];

// Helper functions to work with sources
export function getSourcesByCategory(category: string): NewsFeedSource[] {
  return newsSources.filter(source => source.category === category);
}

export function getRssSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.rssUrl && (source.type === 'rss' || !source.type));
}

export function getCrawlSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.requiresCrawling && source.type !== 'api' && source.type !== 'social');
}

export function getSocialSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.type === 'social');
}

export function getApiSources(): NewsFeedSource[] {
  return newsSources.filter(source => source.type === 'api');
}

export function getSourcesByRegion(region: string): NewsFeedSource[] {
  return newsSources.filter(source => source.region === region);
}

export function getSourceById(id: string): NewsFeedSource | undefined {
  return newsSources.find(source => source.id === id);
}

export function getAvailableCategories(): string[] {
  const categories = new Set<string>();
  newsSources.forEach(source => categories.add(source.category));
  return Array.from(categories);
}

export function getAvailableRegions(): string[] {
  const regions = new Set<string>();
  newsSources.forEach(source => regions.add(source.region));
  return Array.from(regions);
}