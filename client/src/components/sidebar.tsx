import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
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

  const { data: folders = [], isLoading: foldersLoading } = useQuery<(Folder & { count: number })[]>({
    queryKey: ["/api/folders"],
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        initial={{ x: isMobile ? -300 : 0 }}
        animate={{ x: isMobile && !isOpen ? -300 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "w-64 bg-background/80 backdrop-blur-xl rounded-r-2xl shadow-xl fixed inset-y-0 left-0 z-40",
          "md:relative border-r border-border/30"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-border/20">
            <motion.h1 
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <i className="ri-bookmark-line mr-2 text-primary"></i>
              Bookmarkr
            </motion.h1>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            <nav className="p-5">
              <div className="space-y-1">
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    href="/"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-xl font-medium transition-all",
                      location === "/"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-dashboard-line mr-3 text-lg"></i>
                    Dashboard
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/favorites"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-xl font-medium transition-all",
                      location === "/favorites"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-star-line mr-3 text-lg"></i>
                    Favorites
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    href="/tags"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-xl font-medium transition-all",
                      location === "/tags"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-price-tag-3-line mr-3 text-lg"></i>
                    Tags
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/folders"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-xl font-medium transition-all",
                      location === "/folders"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-folder-line mr-3 text-lg"></i>
                    Folders
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    href="/discover"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-xl font-medium transition-all",
                      location === "/discover"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-compass-line mr-3 text-lg"></i>
                    Discover
                  </Link>
                </motion.div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 tracking-wider px-3">
                    COLLECTIONS
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                        <i className="ri-add-line text-gray-500"></i>
                        <span className="sr-only">Add Folder</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new folder</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="space-y-1">
                  {foldersLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="px-3 py-1.5">
                          <Skeleton className="h-9 w-full" />
                        </div>
                      ))
                  ) : folders && folders.length > 0 ? (
                    folders.map((folder: Folder & { count: number }) => (
                      <motion.div 
                        key={folder.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (0.05 * folder.id) }}
                      >
                        <Link
                          href={`/folders/${folder.id}`}
                          onClick={() => isMobile && onClose()}
                          className="flex items-center p-2.5 px-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                        >
                          <div 
                            className="w-7 h-7 rounded-md flex items-center justify-center mr-2.5"
                            style={{ backgroundColor: `${folder.color}30` }}
                          >
                            <i
                              className="ri-folder-fill text-lg"
                              style={{ color: folder.color }}
                            ></i>
                          </div>
                          <span className="text-sm font-medium">{folder.name}</span>
                          {folder.count > 0 && (
                            <Badge 
                              variant="outline" 
                              className="ml-auto py-0 px-1.5 h-5 min-w-5 flex items-center justify-center bg-background/30 backdrop-blur-sm text-muted-foreground text-xs"
                            >
                              {folder.count}
                            </Badge>
                          )}
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      className="px-3 py-2 text-sm text-gray-500 italic"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                    >
                      No folders yet
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 tracking-wider px-3">
                    TAGS
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                        <i className="ri-add-line text-gray-500"></i>
                        <span className="sr-only">Add Tag</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new tag</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <motion.div 
                  className="flex flex-wrap gap-2 px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {tagsLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-6 w-16" />
                      ))
                  ) : tags && tags.length > 0 ? (
                    tags.map((tag: Tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.id}`}
                        onClick={() => isMobile && onClose()}
                      >
                        <Badge 
                          variant="secondary"
                          className="bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer"
                        >
                          #{tag.name}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No tags yet</span>
                  )}
                </motion.div>
              </div>
            </nav>
          </ScrollArea>

          <motion.div 
            className="border-t border-gray-100 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/settings" onClick={() => isMobile && onClose()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-gray-600 hover:text-primary"
              >
                <i className="ri-settings-4-line mr-2"></i>
                <span>Settings</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
