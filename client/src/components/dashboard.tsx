import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookmarkCard } from "@/components/bookmark-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";
import { BookmarkWithTags } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  searchQuery?: string;
}

export function Dashboard({ searchQuery = "" }: DashboardProps) {
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [bookmarkToEdit, setBookmarkToEdit] = useState<BookmarkWithTags | null>(null);

  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ['/api/bookmarks', searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey;
      const url = query ? `/api/bookmarks?q=${encodeURIComponent(query as string)}` : '/api/bookmarks';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return response.json();
    }
  });

  const handleEditBookmark = (bookmark: BookmarkWithTags) => {
    setBookmarkToEdit(bookmark);
  };

  const sortedBookmarks = bookmarks ? [...bookmarks].sort((a: BookmarkWithTags, b: BookmarkWithTags) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  }) : [];

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">
          {searchQuery ? `Search Results: ${searchQuery}` : "Recently Added"}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text text-opacity-70">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex bg-white rounded-md shadow-sm border border-gray-200">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'grid' ? 'text-primary' : 'text-text text-opacity-60'} border-r border-gray-200`}
              onClick={() => setViewMode('grid')}
            >
              <i className="ri-layout-grid-line"></i>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'list' ? 'text-primary' : 'text-text text-opacity-60'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="ri-list-check"></i>
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-[300px]">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          Error loading bookmarks. Please try again.
        </div>
      ) : sortedBookmarks.length === 0 ? (
        <div className="bg-accent p-8 rounded-md text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
          <p className="text-text text-opacity-70 mb-4">
            {searchQuery 
              ? `No bookmarks matching "${searchQuery}". Try a different search term.` 
              : "Your bookmark collection is empty. Add your first bookmark to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBookmarks.map((bookmark: BookmarkWithTags) => (
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark} 
              onEdit={handleEditBookmark}
            />
          ))}
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
    </section>
  );
}
