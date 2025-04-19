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
  const [viewMode, setViewMode] = useState("news");
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
      // Handle potential null dates by using a default date
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
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
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="text-sm bg-background/80 border border-border/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex bg-background/80 rounded-md shadow-sm border border-border/30 backdrop-blur-sm">
            <Button
              variant={viewMode === 'news' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'news' ? 'text-primary' : 'text-muted-foreground'} border-r border-border/30`}
              onClick={() => setViewMode('news')}
            >
              <i className="ri-article-line"></i>
            </Button>
            <Button
              variant={viewMode === 'magazine' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'magazine' ? 'text-primary' : 'text-muted-foreground'} border-r border-border/30`}
              onClick={() => setViewMode('magazine')}
            >
              <i className="ri-newspaper-line"></i>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'} border-r border-border/30`}
              onClick={() => setViewMode('grid')}
            >
              <i className="ri-layout-grid-line"></i>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`px-3 py-1 flex items-center justify-center ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}`}
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
        <div className="bg-red-900/20 text-red-400 p-6 rounded-xl border border-red-800/30 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <i className="ri-error-warning-line text-2xl"></i>
            <div>
              <h3 className="font-medium mb-1">Error loading bookmarks</h3>
              <p className="text-sm opacity-80">Please try refreshing the page or try again later.</p>
            </div>
          </div>
        </div>
      ) : sortedBookmarks.length === 0 ? (
        <div className="bg-card/80 p-8 rounded-xl text-center border border-border/30 backdrop-blur-sm shadow-sm">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `No bookmarks matching "${searchQuery}". Try a different search term.` 
              : "Your bookmark collection is empty. Add your first bookmark to get started."}
          </p>
          <Button variant="outline" className="bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/30">
            <i className="ri-add-line mr-2"></i> Add Your First Bookmark
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'news' ? (
            <div className="space-y-8">
              {/* Top Stories Section */}
              {sortedBookmarks.length > 0 && (
                <section>
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">Top Stories</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Featured Story */}
                    <div className="lg:col-span-6 xl:col-span-7">
                      <BookmarkCard 
                        key={sortedBookmarks[0].id} 
                        bookmark={sortedBookmarks[0]} 
                        onEdit={handleEditBookmark}
                        size="large"
                      />
                    </div>
                    
                    {/* Secondary Stories - Right Column */}
                    <div className="lg:col-span-6 xl:col-span-5">
                      <div className="flex flex-col gap-2">
                        {sortedBookmarks.slice(1, 4).map((bookmark: BookmarkWithTags, index) => (
                          <BookmarkCard 
                            key={bookmark.id} 
                            bookmark={bookmark} 
                            onEdit={handleEditBookmark}
                            variant="list"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
              
              {/* Latest Articles Section */}
              {sortedBookmarks.length > 4 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold border-l-4 border-blue-500 pl-3">Latest Articles</h2>
                    <Button variant="ghost" className="text-sm">View all <i className="ri-arrow-right-line ml-1"></i></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedBookmarks.slice(4, 8).map((bookmark: BookmarkWithTags) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onEdit={handleEditBookmark}
                        size="medium"
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Topic-based Sections */}
              {sortedBookmarks.length > 8 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Technology Section */}
                  <section>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold border-l-4 border-green-500 pl-3">Technology</h2>
                    </div>
                    <div className="space-y-3">
                      <BookmarkCard 
                        key={sortedBookmarks[8].id} 
                        bookmark={sortedBookmarks[8]} 
                        onEdit={handleEditBookmark}
                        variant="list"
                      />
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {sortedBookmarks.slice(9, 11).map((bookmark: BookmarkWithTags) => (
                          <BookmarkCard 
                            key={bookmark.id} 
                            bookmark={bookmark} 
                            onEdit={handleEditBookmark}
                            size="small"
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                  
                  {/* Design Section */}
                  <section>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold border-l-4 border-orange-500 pl-3">Design</h2>
                    </div>
                    <div className="space-y-3">
                      <BookmarkCard 
                        key={sortedBookmarks[11]?.id || sortedBookmarks[8].id} 
                        bookmark={sortedBookmarks[11] || sortedBookmarks[8]} 
                        onEdit={handleEditBookmark}
                        variant="list"
                      />
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {(sortedBookmarks.slice(12, 14).length > 0 ? sortedBookmarks.slice(12, 14) : sortedBookmarks.slice(9, 11)).map((bookmark: BookmarkWithTags) => (
                          <BookmarkCard 
                            key={bookmark.id} 
                            bookmark={bookmark} 
                            onEdit={handleEditBookmark}
                            size="small"
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}
              
              {/* For You Section */}
              {sortedBookmarks.length > 14 && (
                <section>
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold border-l-4 border-purple-500 pl-3">For You</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sortedBookmarks.slice(14).map((bookmark: BookmarkWithTags) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onEdit={handleEditBookmark}
                        size="medium"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : viewMode === 'magazine' ? (
            <div className="grid grid-cols-12 gap-4">
              {sortedBookmarks.length > 0 && (
                <div className="col-span-12 md:col-span-8 lg:col-span-6">
                  <BookmarkCard 
                    key={sortedBookmarks[0].id} 
                    bookmark={sortedBookmarks[0]} 
                    onEdit={handleEditBookmark}
                    size="large"
                  />
                </div>
              )}
              
              <div className="col-span-12 md:col-span-4 lg:col-span-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sortedBookmarks.slice(1, 5).map((bookmark: BookmarkWithTags) => (
                    <BookmarkCard 
                      key={bookmark.id} 
                      bookmark={bookmark} 
                      onEdit={handleEditBookmark}
                      size="small"
                    />
                  ))}
                </div>
              </div>
              
              {sortedBookmarks.length > 5 && (
                <div className="col-span-12">
                  <h3 className="text-lg font-semibold mb-4 border-b border-border/30 pb-2">More Articles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedBookmarks.slice(5).map((bookmark: BookmarkWithTags) => (
                      <BookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onEdit={handleEditBookmark}
                        size="medium"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedBookmarks.map((bookmark: BookmarkWithTags) => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onEdit={handleEditBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedBookmarks.map((bookmark: BookmarkWithTags) => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onEdit={handleEditBookmark}
                  variant="list"
                />
              ))}
            </div>
          )}
        </>
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
