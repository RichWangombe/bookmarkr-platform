import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookmarkTile } from "./bookmark-tile";
import { useState } from "react";
import { BookmarkWithTags } from "@shared/schema";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: {
    id: string;
    name: string;
    iconUrl?: string;
  };
  category: string;
  tags?: string[];
}

export function Discover() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Query for trending news (main featured content)
  const trendingNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/trending", { limit: 5 }],
    refetchOnWindowFocus: false,
  });
  
  // Query for all news
  const allNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
    refetchOnWindowFocus: false,
  });
  
  // Query for technology news
  const techNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/category/technology"],
    enabled: activeCategory === "technology" || activeCategory === "all",
    refetchOnWindowFocus: false,
  });

  // Query for business news
  const businessNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/category/business"],
    enabled: activeCategory === "business" || activeCategory === "all",
    refetchOnWindowFocus: false,
  });

  // Query for design news
  const designNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/category/design"],
    enabled: activeCategory === "design" || activeCategory === "all",
    refetchOnWindowFocus: false,
  });

  // Query for science news
  const scienceNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/category/science"],
    enabled: activeCategory === "science" || activeCategory === "all",
    refetchOnWindowFocus: false,
  });

  // Query for AI news
  const aiNewsQuery = useQuery<NewsItem[]>({
    queryKey: ["/api/news/category/ai"],
    enabled: activeCategory === "ai" || activeCategory === "all",
    refetchOnWindowFocus: false,
  });
  
  // Convert news items to bookmark format for consistent display
  const convertNewsToBookmark = (newsItem: NewsItem): BookmarkWithTags => {
    let domain = '';
    try {
      domain = new URL(newsItem.url).hostname.replace('www.', '');
    } catch (e) {
      domain = newsItem.source.name;
    }
    
    // Create a bookmark that adheres to the BookmarkWithTags type
    const bookmark: BookmarkWithTags = {
      id: parseInt(newsItem.id.split('-')[1], 10) || Math.floor(Math.random() * 10000),
      title: newsItem.title,
      description: newsItem.description || null,
      thumbnailUrl: newsItem.imageUrl || null,
      imageUrl: newsItem.imageUrl || null,
      url: newsItem.url,
      domain: domain,
      favorite: false,
      folderId: null,
      tags: newsItem.tags 
        ? newsItem.tags.map((tag, index) => ({ 
            id: index, 
            name: tag,
            createdAt: new Date()
          })) 
        : [],
      createdAt: new Date(newsItem.publishedAt),
      updatedAt: new Date(),
      // Mark the source information for display
      source: newsItem.source,
      category: newsItem.category,
    };
    
    return bookmark;
  };
  
  // Handle loading state
  const isLoading = 
    trendingNewsQuery.isLoading || 
    allNewsQuery.isLoading ||
    (activeCategory === "technology" && techNewsQuery.isLoading) ||
    (activeCategory === "business" && businessNewsQuery.isLoading) ||
    (activeCategory === "design" && designNewsQuery.isLoading) ||
    (activeCategory === "science" && scienceNewsQuery.isLoading) ||
    (activeCategory === "ai" && aiNewsQuery.isLoading);
  
  // Handle error state
  const hasError = 
    trendingNewsQuery.isError || 
    allNewsQuery.isError ||
    (activeCategory === "technology" && techNewsQuery.isError) ||
    (activeCategory === "business" && businessNewsQuery.isError) ||
    (activeCategory === "design" && designNewsQuery.isError) ||
    (activeCategory === "science" && scienceNewsQuery.isError) ||
    (activeCategory === "ai" && aiNewsQuery.isError);

  // Helper function to render category header
  const renderCategoryHeader = (title: string, category: string) => (
    <div className={`flex items-center py-2 border-l-4 pl-3 mb-4 ${getCategoryColor(category)}`}>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
  
  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'technology': 
        return 'border-blue-500';
      case 'business': 
        return 'border-green-500';
      case 'design': 
        return 'border-purple-500';
      case 'science': 
        return 'border-yellow-500';
      case 'ai': 
        return 'border-red-500';
      case 'news': 
        return 'border-orange-500';
      default: 
        return 'border-gray-500';
    }
  };
  
  if (hasError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          There was an error loading the news feed. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Get trending news items
  const trendingNews = trendingNewsQuery.data || [];
  
  // Define masonry grid layout
  const masonryGridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-fr";
  
  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
        <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-30 pb-2">
          <TabsList className="w-full h-auto justify-start overflow-x-auto flex-nowrap gap-2 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="technology" className="text-xs sm:text-sm">Technology</TabsTrigger>
            <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
            <TabsTrigger value="design" className="text-xs sm:text-sm">Design</TabsTrigger>
            <TabsTrigger value="science" className="text-xs sm:text-sm">Science</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">AI & ML</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="space-y-8 mt-6">
          {isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Top Stories */}
              {trendingNews.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('Top Stories', 'news')}
                  
                  <div className={masonryGridClasses}>
                    {/* Feature the first article in a larger tile */}
                    {trendingNews[0] && (
                      <div className="col-span-2 row-span-2">
                        <BookmarkTile 
                          bookmark={convertNewsToBookmark(trendingNews[0])}
                          size="large"
                        />
                      </div>
                    )}
                    
                    {/* Secondary stories */}
                    {trendingNews.slice(1).map(item => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size="medium"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Technology Section */}
              {techNewsQuery.data && techNewsQuery.data.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('Technology', 'technology')}
                  
                  <div className={masonryGridClasses}>
                    {techNewsQuery.data.slice(0, 10).map((item, index) => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size={index === 0 ? "medium" : "small"}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Business Section */}
              {businessNewsQuery.data && businessNewsQuery.data.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('Business', 'business')}
                  
                  <div className={masonryGridClasses}>
                    {businessNewsQuery.data.slice(0, 10).map((item, index) => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size={index === 1 ? "medium" : "small"}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Design Section */}
              {designNewsQuery.data && designNewsQuery.data.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('Design', 'design')}
                  
                  <div className={masonryGridClasses}>
                    {designNewsQuery.data.slice(0, 10).map((item, index) => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size={index === 2 ? "medium" : "small"}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Science Section */}
              {scienceNewsQuery.data && scienceNewsQuery.data.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('Science', 'science')}
                  
                  <div className={masonryGridClasses}>
                    {scienceNewsQuery.data.slice(0, 10).map((item, index) => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size={index === 0 ? "medium" : "small"}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI & ML Section */}
              {aiNewsQuery.data && aiNewsQuery.data.length > 0 && (
                <div className="space-y-4">
                  {renderCategoryHeader('AI & Machine Learning', 'ai')}
                  
                  <div className={masonryGridClasses}>
                    {aiNewsQuery.data.slice(0, 10).map((item, index) => (
                      <BookmarkTile 
                        key={item.id}
                        bookmark={convertNewsToBookmark(item)}
                        size={index === 3 ? "medium" : "small"}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="technology" className="space-y-6 mt-6">
          {techNewsQuery.isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : techNewsQuery.data && techNewsQuery.data.length > 0 ? (
            <>
              {renderCategoryHeader('Technology News', 'technology')}
              <div className={masonryGridClasses}>
                {techNewsQuery.data.map((item, index) => (
                  <div key={item.id} className={index === 0 || index === 5 ? "col-span-2 row-span-2" : ""}>
                    <BookmarkTile 
                      bookmark={convertNewsToBookmark(item)}
                      size={index === 0 || index === 5 ? "large" : "medium"}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No technology news found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="business" className="space-y-6 mt-6">
          {businessNewsQuery.isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : businessNewsQuery.data && businessNewsQuery.data.length > 0 ? (
            <>
              {renderCategoryHeader('Business News', 'business')}
              <div className={masonryGridClasses}>
                {businessNewsQuery.data.map((item, index) => (
                  <div key={item.id} className={index === 1 || index === 6 ? "col-span-2 row-span-2" : ""}>
                    <BookmarkTile 
                      bookmark={convertNewsToBookmark(item)}
                      size={index === 1 || index === 6 ? "large" : "medium"}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No business news found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="design" className="space-y-6 mt-6">
          {designNewsQuery.isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : designNewsQuery.data && designNewsQuery.data.length > 0 ? (
            <>
              {renderCategoryHeader('Design News', 'design')}
              <div className={masonryGridClasses}>
                {designNewsQuery.data.map((item, index) => (
                  <div key={item.id} className={index === 2 || index === 7 ? "col-span-2 row-span-2" : ""}>
                    <BookmarkTile 
                      bookmark={convertNewsToBookmark(item)}
                      size={index === 2 || index === 7 ? "large" : "medium"}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No design news found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="science" className="space-y-6 mt-6">
          {scienceNewsQuery.isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : scienceNewsQuery.data && scienceNewsQuery.data.length > 0 ? (
            <>
              {renderCategoryHeader('Science News', 'science')}
              <div className={masonryGridClasses}>
                {scienceNewsQuery.data.map((item, index) => (
                  <div key={item.id} className={index === 3 || index === 8 ? "col-span-2 row-span-2" : ""}>
                    <BookmarkTile 
                      bookmark={convertNewsToBookmark(item)}
                      size={index === 3 || index === 8 ? "large" : "medium"}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No science news found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-6 mt-6">
          {aiNewsQuery.isLoading ? (
            <div className={masonryGridClasses}>
              {[...Array(10)].map((_, index) => (
                <Skeleton key={index} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : aiNewsQuery.data && aiNewsQuery.data.length > 0 ? (
            <>
              {renderCategoryHeader('AI & Machine Learning', 'ai')}
              <div className={masonryGridClasses}>
                {aiNewsQuery.data.map((item, index) => (
                  <div key={item.id} className={index === 4 || index === 9 ? "col-span-2 row-span-2" : ""}>
                    <BookmarkTile 
                      bookmark={convertNewsToBookmark(item)}
                      size={index === 4 || index === 9 ? "large" : "medium"}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No AI & ML news found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}