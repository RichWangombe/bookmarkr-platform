import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertBookmarkSchema,
  insertFolderSchema,
  insertTagSchema,
} from "@shared/schema";
import fetch from "node-fetch";
import { extractMetadata } from "./metadata";
import { 
  getAllNews, 
  getNewsByCategory, 
  getTrendingNews,
  getTopNewsByCategory, 
  newsSources, 
  getSourcesByCategory 
} from "./feeds";
import suggestionsRouter from "./routes/suggestions";
import recommendationsRouter from "./routes/recommendations";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the API routers
  app.use('/api/suggestions', suggestionsRouter);
  app.use('/api/recommendations', recommendationsRouter);
  // Bookmarks API
  app.get("/api/bookmarks", async (req: Request, res: Response) => {
    const query = req.query.q as string | undefined;
    const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
    const favorite = req.query.favorite === "true";
    const tagId = req.query.tagId ? Number(req.query.tagId) : undefined;
    
    let bookmarks;
    
    if (query) {
      bookmarks = await storage.searchBookmarks(query);
    } else if (folderId !== undefined) {
      bookmarks = await storage.getBookmarksByFolder(folderId);
    } else if (favorite) {
      bookmarks = await storage.getFavoriteBookmarks();
    } else if (tagId !== undefined) {
      bookmarks = await storage.getBookmarksByTag(tagId);
    } else {
      bookmarks = await storage.getAllBookmarks();
    }
    
    res.json(bookmarks);
  });
  
  app.get("/api/bookmarks/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const bookmark = await storage.getBookmarkById(id);
    
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    
    res.json(bookmark);
  });
  
  app.post("/api/bookmarks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBookmarkSchema.parse(req.body);
      
      // If URL is provided without other metadata, try to fetch it
      if (validatedData.url && (!validatedData.title || !validatedData.description || !validatedData.thumbnailUrl)) {
        try {
          const metadata = await extractMetadata(validatedData.url);
          
          // Only use fetched metadata for fields that aren't already provided
          if (!validatedData.title && metadata.title) {
            validatedData.title = metadata.title;
          }
          
          if (!validatedData.description && metadata.description) {
            validatedData.description = metadata.description;
          }
          
          if (!validatedData.thumbnailUrl && metadata.image) {
            validatedData.thumbnailUrl = metadata.image;
          }
          
          if (!validatedData.domain && metadata.domain) {
            validatedData.domain = metadata.domain;
          }
        } catch (error) {
          console.error("Error fetching metadata:", error);
          // Continue with whatever data we have
        }
      }
      
      // Ensure title exists even if metadata fetch failed
      if (!validatedData.title) {
        validatedData.title = validatedData.url;
      }
      
      const bookmark = await storage.createBookmark(validatedData);
      
      // Handle tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          // Find or create the tag
          let tag = await storage.getTagByName(tagName);
          
          if (!tag) {
            tag = await storage.createTag({ name: tagName });
          }
          
          // Associate tag with bookmark
          await storage.addTagToBookmark(bookmark.id, tag.id);
        }
      }
      
      // Get the complete bookmark with tags
      const completeBookmark = await storage.getBookmarkById(bookmark.id);
      res.status(201).json(completeBookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });
  
  app.patch("/api/bookmarks/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    
    try {
      // Validate the partial data
      const validatedData = insertBookmarkSchema.partial().parse(req.body);
      const updatedBookmark = await storage.updateBookmark(id, validatedData);
      
      if (!updatedBookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      // Handle tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        // Get current tags
        const currentTags = await storage.getTagsForBookmark(id);
        const currentTagNames = currentTags.map(tag => tag.name);
        const newTagNames = req.body.tags;
        
        // Remove tags that are no longer present
        for (const tag of currentTags) {
          if (!newTagNames.includes(tag.name)) {
            await storage.removeTagFromBookmark(id, tag.id);
          }
        }
        
        // Add new tags
        for (const tagName of newTagNames) {
          if (!currentTagNames.includes(tagName)) {
            // Find or create the tag
            let tag = await storage.getTagByName(tagName);
            
            if (!tag) {
              tag = await storage.createTag({ name: tagName });
            }
            
            // Associate tag with bookmark
            await storage.addTagToBookmark(id, tag.id);
          }
        }
      }
      
      // Get the complete bookmark with tags
      const completeBookmark = await storage.getBookmarkById(id);
      res.json(completeBookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      
      console.error("Error updating bookmark:", error);
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });
  
  app.delete("/api/bookmarks/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await storage.deleteBookmark(id);
    
    if (!result) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    
    res.json({ success: true });
  });
  
  // Folders API
  app.get("/api/folders", async (_req: Request, res: Response) => {
    const folders = await storage.getAllFolders();
    res.json(folders);
  });
  
  app.post("/api/folders", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });
  
  app.patch("/api/folders/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    
    try {
      const validatedData = insertFolderSchema.partial().parse(req.body);
      const updatedFolder = await storage.updateFolder(id, validatedData);
      
      if (!updatedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(updatedFolder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      
      console.error("Error updating folder:", error);
      res.status(500).json({ message: "Failed to update folder" });
    }
  });
  
  app.delete("/api/folders/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await storage.deleteFolder(id);
    
    if (!result) {
      return res.status(404).json({ message: "Folder not found" });
    }
    
    res.json({ success: true });
  });
  
  // Tags API
  app.get("/api/tags", async (_req: Request, res: Response) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });
  
  app.post("/api/tags", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      
      // Check if tag already exists
      const existingTag = await storage.getTagByName(validatedData.name);
      
      if (existingTag) {
        return res.status(400).json({ message: "Tag already exists" });
      }
      
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });
  
  // Bookmark Tags API
  app.post("/api/bookmarks/:id/tags", async (req: Request, res: Response) => {
    const bookmarkId = Number(req.params.id);
    
    try {
      const { tagIds } = req.body;
      
      if (!tagIds || !Array.isArray(tagIds)) {
        return res.status(400).json({ message: "tagIds array is required" });
      }
      
      // Verify the bookmark exists
      const bookmark = await storage.getBookmarkById(bookmarkId);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      // Add each tag to the bookmark
      for (const tagId of tagIds) {
        await storage.addTagToBookmark(bookmarkId, tagId);
      }
      
      // Get the updated bookmark with tags
      const updatedBookmark = await storage.getBookmarkById(bookmarkId);
      res.json(updatedBookmark);
    } catch (error) {
      console.error("Error adding tags to bookmark:", error);
      res.status(500).json({ message: "Failed to add tags to bookmark" });
    }
  });
  
  app.delete("/api/bookmarks/:bookmarkId/tags/:tagId", async (req: Request, res: Response) => {
    const bookmarkId = Number(req.params.bookmarkId);
    const tagId = Number(req.params.tagId);
    
    try {
      // Verify the bookmark exists
      const bookmark = await storage.getBookmarkById(bookmarkId);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      await storage.removeTagFromBookmark(bookmarkId, tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing tag from bookmark:", error);
      res.status(500).json({ message: "Failed to remove tag from bookmark" });
    }
  });
  
  // Metadata API
  app.post("/api/metadata", async (req: Request, res: Response) => {
    const schema = z.object({
      url: z.string().url(),
    });
    
    try {
      const { url } = schema.parse(req.body);
      
      try {
        const metadata = await extractMetadata(url);
        res.json(metadata);
      } catch (error) {
        console.error("Error extracting metadata:", error);
        res.status(500).json({ message: "Failed to extract metadata" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid URL", errors: error.errors });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // News Feed API
  app.get("/api/news", async (_req: Request, res: Response) => {
    try {
      const news = await getAllNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });
  
  app.get("/api/news/trending", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const news = await getTrendingNews(limit);
      res.json(news);
    } catch (error) {
      console.error("Error fetching trending news:", error);
      res.status(500).json({ message: "Failed to fetch trending news" });
    }
  });
  
  app.get("/api/news/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const news = await getNewsByCategory(category);
      res.json(news);
    } catch (error) {
      console.error(`Error fetching ${req.params.category} news:`, error);
      res.status(500).json({ message: `Failed to fetch ${req.params.category} news` });
    }
  });
  
  app.get("/api/news/top-by-category", async (_req: Request, res: Response) => {
    try {
      const topNews = await getTopNewsByCategory();
      res.json(topNews);
    } catch (error) {
      console.error("Error fetching top news by category:", error);
      res.status(500).json({ message: "Failed to fetch top news by category" });
    }
  });
  
  app.get("/api/news/sources", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const sources = category ? getSourcesByCategory(category) : newsSources;
      res.json(sources);
    } catch (error) {
      console.error("Error fetching news sources:", error);
      res.status(500).json({ message: "Failed to fetch news sources" });
    }
  });
  
  // Recommendations API - now uses our news feed system
  app.get("/api/recommendations", async (_req: Request, res: Response) => {
    try {
      // Try to get trending news for recommendations
      try {
        const trendingNews = await getTrendingNews(3);
        if (trendingNews.length > 0) {
          // Convert news items to recommendation format
          const recommendations = trendingNews.map((item, index) => ({
            id: index + 1,
            title: item.title,
            description: item.description,
            thumbnailUrl: item.imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
            url: item.url,
            source: item.source.name,
            readTime: `${Math.floor(Math.random() * 10) + 2} min read`, // Estimate read time
            type: "article"
          }));
          
          return res.json(recommendations);
        }
      } catch (error) {
        console.error("Error fetching trending news for recommendations:", error);
        // Fall back to analyzing bookmarks if news fetch fails
      }
      
      // If we reach here, either trending news failed or returned no items
      // Fall back to analyzing user bookmarks
      const allBookmarks = await storage.getAllBookmarks();
      
      if (allBookmarks.length === 0) {
        return res.json([]);
      }
      
      // Get all tags with their count
      const tagMap = new Map<string, number>();
      
      for (const bookmark of allBookmarks) {
        for (const tag of bookmark.tags) {
          const count = tagMap.get(tag.name) || 0;
          tagMap.set(tag.name, count + 1);
        }
      }
      
      // Sort tags by popularity
      const sortedTags = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      
      // Create fallback recommendations based on most popular tags
      const fallbackRecommendations = [
        {
          id: 1,
          title: "React Performance Optimization: A Complete Guide",
          description: "Learn proven techniques to optimize your React applications for better performance.",
          thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
          url: "https://example.com/react-performance",
          source: "Popular in JavaScript",
          readTime: "5 min read",
          type: "article"
        },
        {
          id: 2,
          title: "UX Design Trends to Watch in 2023",
          description: "Stay ahead of the curve with these emerging UX design trends that are shaping digital experiences.",
          thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3",
          url: "https://example.com/ux-trends-2023",
          source: "Based on your interests",
          readTime: "8 min read",
          type: "article"
        },
        {
          id: 3,
          title: "How to Build a Sustainable Remote Work Routine",
          description: "Create a productive remote work environment with these proven strategies for work-life balance.",
          thumbnailUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d",
          url: "https://example.com/remote-work-routine",
          source: "Popular in Productivity",
          readTime: "6 min read",
          type: "article"
        }
      ];
      
      res.json(fallbackRecommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
