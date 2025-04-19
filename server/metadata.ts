import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { URL } from "url";

export interface Metadata {
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
  category?: string | null;
}

export async function extractMetadata(url: string): Promise<Metadata> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace(/^www\./, "");
    
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract metadata
    let title = null;
    let description = null;
    let image = null;
    let category = null;
    
    // First try Open Graph tags
    title = getMetaContent(document, 'og:title') || 
            getMetaContent(document, 'twitter:title');
    
    description = getMetaContent(document, 'og:description') || 
                  getMetaContent(document, 'twitter:description') || 
                  getMetaContent(document, 'description');
    
    image = getMetaContent(document, 'og:image') || 
            getMetaContent(document, 'twitter:image');
    
    // If meta tags failed, use document title and other elements
    if (!title) {
      const titleElement = document.querySelector('title');
      title = titleElement ? titleElement.textContent : null;
    }
    
    if (!description) {
      // Try to get the first paragraph with reasonable length
      const paragraphs = document.querySelectorAll('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i].textContent?.trim();
        if (text && text.length > 50) {
          description = text;
          break;
        }
      }
    }
    
    // Try to categorize the content based on meta keywords or content
    const keywords = getMetaContent(document, 'keywords');
    if (keywords) {
      const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
      
      if (keywordList.some(k => ['programming', 'javascript', 'code', 'developer', 'web development'].includes(k))) {
        category = 'programming';
      } else if (keywordList.some(k => ['design', 'ui', 'ux', 'graphic', 'interface'].includes(k))) {
        category = 'design';
      } else if (keywordList.some(k => ['productivity', 'management', 'workflow', 'efficiency'].includes(k))) {
        category = 'productivity';
      } else if (keywordList.some(k => ['learn', 'education', 'tutorial', 'guide', 'course'].includes(k))) {
        category = 'learning';
      }
    }
    
    // Handle relative URLs for images
    if (image && !image.startsWith('http')) {
      if (image.startsWith('//')) {
        image = parsedUrl.protocol + image;
      } else if (image.startsWith('/')) {
        image = `${parsedUrl.protocol}//${parsedUrl.host}${image}`;
      } else {
        image = `${parsedUrl.protocol}//${parsedUrl.host}/${image}`;
      }
    }
    
    // Limit description length
    if (description && description.length > 200) {
      description = description.substring(0, 197) + '...';
    }
    
    return {
      title,
      description,
      image,
      domain,
      category
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw new Error(`Failed to extract metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getMetaContent(document: Document, name: string): string | null {
  const element = 
    document.querySelector(`meta[name="${name}"]`) || 
    document.querySelector(`meta[property="${name}"]`);
  
  return element ? element.getAttribute('content') : null;
}
