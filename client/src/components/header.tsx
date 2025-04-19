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
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="mr-2"
          >
            <i className="ri-menu-line text-xl"></i>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        <div className="flex items-center flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="ri-search-line text-text text-opacity-60"></i>
              </div>
              <Input
                type="search"
                className="block w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Search bookmarks..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-4 ml-4">
          <Button
            variant="default"
            className="hidden md:flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowAddBookmark(true)}
          >
            <i className="ri-add-line mr-1"></i>
            <span>Add Bookmark</span>
          </Button>
          <Button
            variant="default"
            size="icon"
            className="md:hidden flex items-center p-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowAddBookmark(true)}
          >
            <i className="ri-add-line"></i>
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-card hover:bg-accent transition-colors"
            >
              <i className="ri-notification-3-line text-text"></i>
            </Button>
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          
          <div>
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-medium"
            >
              JD
            </Button>
          </div>
        </div>
      </div>

      <AddBookmarkDialog
        open={showAddBookmark}
        onOpenChange={setShowAddBookmark}
      />
    </header>
  );
}
