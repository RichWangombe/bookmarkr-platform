import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MasonryGrid } from "./masonry-grid";
import { TrendingSection } from "./trending-section";
import { BookmarkWithTags } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, BookmarkPlus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// List of available categories
const CATEGORIES = [
  { value: "all", label: "All News" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "design", label: "Design" },
  { value: "science", label: "Science" },
  { value: "ai", label: "AI & ML" }
];

export function NewsFeed() {
  const [category, setCategory] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch news based on selected category
  const { data: newsItems, isLoading, isError, refetch } = useQuery({
    queryKey: [category === "all" ? "/api/news" : `/api/news/category/${category}`],
    queryFn: async () => {
      const endpoint = category === "all" ? "/api/news" : `/api/news/category/${category}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json() as Promise<BookmarkWithTags[]>;
    },
  });
  
  // Add bookmark mutation
  const { mutate: addBookmark } = useMutation({
    mutationFn: async (newsItem: BookmarkWithTags) => {
      // Remove properties not in the bookmark schema
      const { tags, source, category, ...bookmarkData } = newsItem;
      
      // Add bookmark using the API
      return apiRequest("/api/bookmarks", "POST", {
        ...bookmarkData,
        favorite: false,
        // If there's no thumbnailUrl but there's an imageUrl, use that
        thumbnailUrl: bookmarkData.thumbnailUrl || bookmarkData.imageUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Bookmark added",
        description: "The item has been saved to your bookmarks.",
      });
      // Invalidate bookmarks cache
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle bookmark button click
  const handleBookmark = (item: BookmarkWithTags) => {
    addBookmark(item);
  };
  
  // Show loading skeletons during initial load
  if (isLoading) {
    return (
      <div className="w-full">
        <Tabs defaultValue="all" className="w-full mb-6">
          <TabsList className="mb-4">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="w-full text-center py-12">
        <h3 className="text-xl font-medium mb-2">Failed to load news</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading the latest content.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Only show trending section on 'all' category */}
      {category === "all" && (
        <TrendingSection onBookmark={handleBookmark} />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <Tabs 
          value={category} 
          onValueChange={setCategory}
          className="w-full"
        >
          <TabsList className="mb-4">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="ml-2"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {newsItems && newsItems.length > 0 ? (
            <MasonryGrid 
              items={category === "all" ? newsItems.slice(3) : newsItems} 
              columns={3}
              gap={16}
              onBookmark={handleBookmark}
            />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No news found</h3>
              <p className="text-muted-foreground">
                There are no news items available for {category === "all" ? "any category" : category}.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}