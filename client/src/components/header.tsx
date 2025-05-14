import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Menu,
  X,
  Bell,
  BookmarkPlus,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./theme-provider";

interface HeaderProps {
  onMenuToggle: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onAddBookmark?: () => void;
}

export function Header({ onMenuToggle, onSearch, searchQuery, onAddBookmark }: HeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const { theme, setTheme } = useTheme();
  
  const handleSearch = () => {
    onSearch(inputValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 mr-2 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              B
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Bookmarkr</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
          <div className="max-w-lg w-full lg:max-w-xs">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <Input
                type="text"
                placeholder="Search bookmarks..."
                className="block w-full rounded-md py-1.5 pl-10 pr-3 text-gray-900 bg-background ring-1 ring-inset ring-input focus-visible:ring-2 focus-visible:ring-ring"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {inputValue && (
                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                  <button
                    type="button"
                    onClick={() => setInputValue("")}
                    className="inline-flex items-center px-1 rounded border-0 focus:ring-2 focus:ring-inset focus:ring-ring"
                  >
                    <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">Clear search</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onAddBookmark}>
            <BookmarkPlus className="h-5 w-5" />
            <span className="sr-only">Add bookmark</span>
          </Button>
          
          <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-sm font-medium">US</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}