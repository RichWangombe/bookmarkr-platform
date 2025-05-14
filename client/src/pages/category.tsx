import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { MasonryGrid } from "@/components/masonry-grid";
import { Button } from "@/components/ui/button";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { BookmarkWithTags } from "@shared/schema";

// Mapping of category paths to display names and colors
export const categoryMap: Record<string, { name: string; color: string; icon: string }> = {
  technology: { name: "Technology", color: "text-green-500", icon: "ri-code-box-line" },
  design: { name: "Design", color: "text-orange-500", icon: "ri-paint-brush-line" },
  business: { name: "Business", color: "text-blue-500", icon: "ri-briefcase-line" },
  ai: { name: "AI & Machine Learning", color: "text-purple-500", icon: "ri-robot-line" },
  science: { name: "Science", color: "text-teal-500", icon: "ri-flask-line" },
  politics: { name: "Politics", color: "text-red-500", icon: "ri-government-line" },
  health: { name: "Health", color: "text-pink-500", icon: "ri-heart-pulse-line" },
  entertainment: { name: "Entertainment", color: "text-yellow-500", icon: "ri-film-line" },
  sports: { name: "Sports", color: "text-cyan-500", icon: "ri-basketball-line" },
  world: { name: "World News", color: "text-emerald-500", icon: "ri-earth-line" },
  finance: { name: "Finance", color: "text-lime-500", icon: "ri-money-dollar-circle-line" },
  education: { name: "Education", color: "text-amber-500", icon: "ri-book-open-line" },
  travel: { name: "Travel", color: "text-indigo-500", icon: "ri-plane-line" },
  food: { name: "Food", color: "text-rose-500", icon: "ri-restaurant-line" },
  environment: { name: "Environment", color: "text-green-600", icon: "ri-plant-line" }
};

export default function CategoryPage() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<BookmarkWithTags | null>(null);
  
  // Extract category slug from the URL
  const categorySlug = location.split('/')[1];
  const category = categoryMap[categorySlug] || { name: "Category", color: "text-gray-500", icon: "ri-bookmark-line" };
  
  // Fetch news for the category
  const { data: news, isLoading: newsLoading, isError } = useQuery({
    queryKey: ['/api/news/category', categorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/news/category/${categorySlug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${categorySlug} news`);
      }
      return response.json();
    },
    enabled: !!categorySlug,
  });
  
  useEffect(() => {
    // Simulate loading for smoother transitions
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [categorySlug]);

  const handleEditBookmark = (bookmark: BookmarkWithTags) => {
    setBookmarkToEdit(bookmark);
  };

  if (isError) {
    return (
      <div className="container max-w-screen-2xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load {category.name} news. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl mx-auto p-4 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${category.color.replace('text-', 'bg-').replace('500', '500/20')}`}>
            <i className={`${category.icon} text-2xl ${category.color}`}></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{category.name} News</h1>
            <p className="text-sm text-muted-foreground">
              Latest updates in {category.name.toLowerCase()}
            </p>
          </div>
        </div>
        
        <div>
          <Button variant="outline" className="mr-2">
            <i className="ri-refresh-line mr-1"></i>
            Refresh
          </Button>
          <Button>
            <i className="ri-bookmark-line mr-1"></i>
            Subscribe
          </Button>
        </div>
      </motion.div>

      {isLoading || newsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="h-[300px] rounded-lg overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : news && news.length > 0 ? (
        <MasonryGrid 
          items={news} 
          onBookmark={handleEditBookmark}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4"
        >
          <div className="max-w-md mx-auto">
            <i className={`${category.icon} text-6xl block mb-4 mx-auto ${category.color}`}></i>
            <h3 className="text-lg font-medium mb-2">No {category.name.toLowerCase()} news found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any recent news in this category. Try again later.
            </p>
            <Button>
              Browse other categories
            </Button>
          </div>
        </motion.div>
      )}

      {bookmarkToEdit && (
        <AddBookmarkDialog
          open={!!bookmarkToEdit}
          onOpenChange={(open) => {
            if (!open) setBookmarkToEdit(null);
          }}
          bookmarkToEdit={bookmarkToEdit}
        />
      )}
    </div>
  );
}