import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Folder } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = window.innerWidth < 768;

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [location, isMobile, isOpen, onClose]);

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ["/api/folders"],
  });

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ["/api/tags"],
  });

  return (
    <aside
      className={cn(
        "w-64 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex-shrink-0 fixed inset-y-0 left-0 z-40",
        "transition-transform duration-300 ease-in-out",
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0",
        "md:relative"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-primary flex items-center">
            <i className="ri-bookmark-line mr-2"></i>
            Bookmarkr
          </h1>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    "flex items-center p-2 rounded-md font-medium",
                    location === "/"
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "hover:bg-accent text-text"
                  )}
                >
                  <i className="ri-dashboard-line mr-3 text-lg"></i>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    "flex items-center p-2 rounded-md font-medium",
                    location === "/favorites"
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "hover:bg-accent text-text"
                  )}
                >
                  <i className="ri-star-line mr-3 text-lg"></i>
                  Favorites
                </Link>
              </li>
              <li>
                <Link
                  href="/tags"
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    "flex items-center p-2 rounded-md font-medium",
                    location === "/tags"
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "hover:bg-accent text-text"
                  )}
                >
                  <i className="ri-price-tag-3-line mr-3 text-lg"></i>
                  Tags
                </Link>
              </li>
              <li>
                <Link
                  href="/folders"
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    "flex items-center p-2 rounded-md font-medium",
                    location === "/folders"
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "hover:bg-accent text-text"
                  )}
                >
                  <i className="ri-folder-line mr-3 text-lg"></i>
                  Folders
                </Link>
              </li>
              <li>
                <Link
                  href="/discover"
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    "flex items-center p-2 rounded-md font-medium",
                    location === "/discover"
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "hover:bg-accent text-text"
                  )}
                >
                  <i className="ri-compass-line mr-3 text-lg"></i>
                  Discover
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <h3 className="text-xs uppercase font-semibold text-text text-opacity-60 mb-2 px-2">
                Collections
              </h3>
              <ul className="space-y-1">
                {foldersLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <li key={i} className="px-2 py-1">
                        <Skeleton className="h-7 w-full" />
                      </li>
                    ))
                ) : folders && folders.length > 0 ? (
                  folders.map((folder: Folder & { count: number }) => (
                    <li key={folder.id}>
                      <Link
                        href={`/folders/${folder.id}`}
                        onClick={() => isMobile && onClose()}
                        className="flex items-center p-2 rounded-md hover:bg-accent text-text"
                      >
                        <i
                          className="ri-folder-fill mr-3"
                          style={{ color: folder.color || "#4A90E2" }}
                        ></i>
                        <span>{folder.name}</span>
                        <span className="ml-auto text-xs text-text text-opacity-60">
                          {folder.count || 0}
                        </span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-1 text-sm text-gray-500">
                    No folders yet
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="text-xs uppercase font-semibold text-text text-opacity-60 mb-2 px-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2 px-2">
                {tagsLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-5 w-16" />
                    ))
                ) : tags && tags.length > 0 ? (
                  tags.map((tag: Tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.id}`}
                      onClick={() => isMobile && onClose()}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tags yet</span>
                )}
              </div>
            </div>
          </nav>
        </ScrollArea>

        <div className="border-t p-4">
          <Link
            href="/settings"
            onClick={() => isMobile && onClose()}
            className="flex items-center text-text text-opacity-80 hover:text-primary"
          >
            <i className="ri-settings-line mr-2"></i>
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
