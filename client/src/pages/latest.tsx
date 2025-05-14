import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookmarkWithTags } from "@shared/schema";
import { BookmarkCard } from "@/components/bookmark-card";
import { MasonryGrid } from "@/components/masonry-grid";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Latest() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkToEdit, setBookmarkToEdit] = useState<BookmarkWithTags | null>(null);
  
  // Fetch latest bookmarks
  const { data: bookmarks, isLoading, isError } = useQuery({
    queryKey: ['/api/bookmarks', 'latest'],
    queryFn: async () => {
      const response = await fetch('/api/bookmarks?sort=latest');
      if (!response.ok) throw new Error('Failed to fetch latest bookmarks');
      return response.json();
    }
  });

  const handleEditBookmark = (bookmark: BookmarkWithTags) => {
    setBookmarkToEdit(bookmark);
  };

  return (
    <div className="container max-w-screen-2xl mx-auto p-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Latest Bookmarks</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9 p-0 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-9 w-9 p-0 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-[300px] rounded-lg overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading your latest bookmarks. Please try again.
          </AlertDescription>
        </Alert>
      ) : bookmarks?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4"
        >
          <div className="max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-muted-foreground">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M8 12h8"></path>
              <path d="M12 8v8"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-6">
              Start saving your favorite articles and websites
            </p>
            <Button>
              Add your first bookmark
            </Button>
          </div>
        </motion.div>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <MasonryGrid 
              items={bookmarks} 
              onBookmark={handleEditBookmark}
            />
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark: BookmarkWithTags) => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onEdit={handleEditBookmark}
                  size="large" 
                  variant="list"
                />
              ))}
            </div>
          )}
        </div>
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