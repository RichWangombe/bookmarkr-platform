import { useQuery } from "@tanstack/react-query";
import { BookmarkWithTags } from "@shared/schema";
import { BookmarkTile } from "./bookmark-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface TrendingSectionProps {
  onBookmark?: (bookmark: BookmarkWithTags) => void;
  onTagClick?: (tagId: number) => void;
}

export function TrendingSection({ onBookmark, onTagClick }: TrendingSectionProps) {
  // Fetch trending news
  const { data: trendingItems, isLoading, isError } = useQuery({
    queryKey: ['/api/news/trending'],
    queryFn: async () => {
      const response = await fetch('/api/news/trending');
      if (!response.ok) {
        throw new Error('Failed to fetch trending news');
      }
      return response.json() as Promise<BookmarkWithTags[]>;
    },
  });
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 bg-muted rounded-full animate-pulse mr-2" />
          <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 col-span-1 md:col-span-2 lg:col-span-1" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  if (isError || !trendingItems || trendingItems.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center mb-4">
        <div className="glass-panel primary-glow bg-primary/10 text-primary p-2 rounded-full mr-2 flex items-center justify-center">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-medium dark:text-white">Trending Now</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendingItems.slice(0, 3).map((item, index) => (
          <motion.div 
            key={item.id} 
            className={`${index === 0 ? "col-span-1 md:col-span-2 lg:col-span-1" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.25, 0.1, 0.25, 1] 
            }}
          >
            <BookmarkTile 
              bookmark={item}
              onBookmark={onBookmark}
              onTagClick={onTagClick}
              isCompact={false}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}