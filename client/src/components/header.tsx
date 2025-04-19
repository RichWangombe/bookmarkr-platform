import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog";

interface HeaderProps {
  onMenuToggle: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function Header({ onMenuToggle, onSearch, searchQuery }: HeaderProps) {
  const [location] = useLocation();
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-30 shadow-sm">
      {/* Top header bar */}
      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="mr-2 text-foreground"
          >
            <i className="ri-menu-line text-xl"></i>
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-primary">B</span>ookmarkr<span className="text-primary">News</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <form onSubmit={handleSearchSubmit} className="relative mx-2 w-full max-w-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="ri-search-line text-muted-foreground"></i>
              </div>
              <Input
                type="search"
                className="block w-full pl-10 pr-4 py-1.5 rounded-full border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 text-sm"
                placeholder="Search bookmarks..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="flex items-center space-x-3 ml-2">
            <Button
              variant="outline"
              className="hidden md:flex items-center px-3 py-1.5 rounded-full border-primary/20 hover:border-primary/30 bg-background/50 text-sm"
              onClick={() => setShowAddBookmark(true)}
            >
              <i className="ri-add-line mr-1.5"></i>
              <span>Add Content</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden flex items-center justify-center p-2 rounded-full border-primary/20 hover:border-primary/30 bg-background/50"
              onClick={() => setShowAddBookmark(true)}
            >
              <i className="ri-add-line"></i>
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-background/70 transition-colors"
              >
                <i className="ri-notification-3-line text-muted-foreground"></i>
              </Button>
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/90 text-white font-medium"
              >
                JD
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary nav - Categories */}
      <div className="flex items-center space-x-1 px-2 md:px-4 py-1 overflow-x-auto scrollbar-hide border-t border-border/20">
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm bg-primary text-white">
          For you
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          Technology
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          Design
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          Programming
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          Business
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          Science
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          News
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">
          AI & ML
        </Button>
      </div>

      <AddBookmarkDialog
        open={showAddBookmark}
        onOpenChange={setShowAddBookmark}
      />
    </header>
  );
}
