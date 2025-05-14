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
          "w-72 dark:bg-[#0c111d]/70 dark:backdrop-blur-xl rounded-r-2xl shadow-xl fixed inset-y-0 left-0 z-40",
          "md:relative border-r border-border/20 dark:border-primary/10 glass-panel"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-border/20">
            <motion.h1 
              className="text-xl font-bold text-foreground flex items-center mb-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-primary">B</span>ookmarkr<span className="text-primary">News</span>
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Your personal news aggregator
            </motion.p>
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
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/"
                        ? "bg-primary text-white shadow-md shadow-primary/30 dark:shadow-primary/40 dark:border border-primary/10"
                        : "hover:bg-muted text-foreground dark:hover:bg-primary/10 dark:hover:text-white"
                    )}
                  >
                    <i className="ri-home-line mr-3 text-lg"></i>
                    For You
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
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/favorites"
                        ? "bg-primary text-white shadow-md shadow-primary/30 dark:shadow-primary/40 dark:border border-primary/10"
                        : "hover:bg-muted text-foreground dark:hover:bg-primary/10 dark:hover:text-white"
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
                    href="/latest"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/latest"
                        ? "bg-primary text-white shadow-md shadow-primary/30 dark:shadow-primary/40 dark:border border-primary/10"
                        : "hover:bg-muted text-foreground dark:hover:bg-primary/10 dark:hover:text-white"
                    )}
                  >
                    <i className="ri-rocket-line mr-3 text-lg"></i>
                    Latest
                  </Link>
                </motion.div>
                
                <div className="pt-2 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider px-3 mb-2">
                    CATEGORIES
                  </h3>
                </div>
                
                {/* Technology */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/technology"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/technology"
                        ? "text-green-500 bg-green-500/10 dark:bg-green-950/30 dark:shadow-sm dark:shadow-green-500/10"
                        : "hover:bg-muted text-foreground dark:hover:bg-accent/30"
                    )}
                  >
                    <i className="ri-code-box-line mr-3 text-lg text-green-500"></i>
                    Technology
                  </Link>
                </motion.div>
                
                {/* Business */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    href="/business"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/business"
                        ? "text-blue-500 bg-blue-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-briefcase-line mr-3 text-lg text-blue-500"></i>
                    Business
                  </Link>
                </motion.div>
                
                {/* World News */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href="/world"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/world"
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-earth-line mr-3 text-lg text-emerald-500"></i>
                    World News
                  </Link>
                </motion.div>
                
                {/* Politics */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <Link
                    href="/politics"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/politics"
                        ? "text-red-500 bg-red-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-government-line mr-3 text-lg text-red-500"></i>
                    Politics
                  </Link>
                </motion.div>
                
                {/* Science */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link
                    href="/science"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/science"
                        ? "text-teal-500 bg-teal-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-flask-line mr-3 text-lg text-teal-500"></i>
                    Science
                  </Link>
                </motion.div>
                
                {/* AI & ML */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <Link
                    href="/ai"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/ai"
                        ? "text-purple-500 bg-purple-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-robot-line mr-3 text-lg text-purple-500"></i>
                    AI & ML
                  </Link>
                </motion.div>
                
                {/* Health */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/health"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/health"
                        ? "text-pink-500 bg-pink-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-heart-pulse-line mr-3 text-lg text-pink-500"></i>
                    Health
                  </Link>
                </motion.div>
                
                {/* Sports */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <Link
                    href="/sports"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/sports"
                        ? "text-cyan-500 bg-cyan-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-basketball-line mr-3 text-lg text-cyan-500"></i>
                    Sports
                  </Link>
                </motion.div>
                
                {/* Entertainment */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link
                    href="/entertainment"
                    onClick={() => isMobile && onClose()}
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-all",
                      location === "/entertainment"
                        ? "text-yellow-500 bg-yellow-500/10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <i className="ri-film-line mr-3 text-lg text-yellow-500"></i>
                    Entertainment
                  </Link>
                </motion.div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground tracking-wider px-3">
                    COLLECTIONS
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                        <i className="ri-add-line text-muted-foreground"></i>
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
                          className="flex items-center p-2.5 px-3 rounded-lg text-foreground hover:bg-muted dark:hover:bg-primary/5 transition-all"
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
                      className="px-3 py-2 text-sm text-muted-foreground italic"
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
                  <h3 className="text-xs font-bold text-muted-foreground tracking-wider px-3">
                    TAGS
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                        <i className="ri-add-line text-muted-foreground"></i>
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
                          className="bg-primary/15 hover:bg-primary/25 text-primary cursor-pointer backdrop-blur-sm"
                        >
                          #{tag.name}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No tags yet</span>
                  )}
                </motion.div>
              </div>
            </nav>
          </ScrollArea>

          <motion.div 
            className="border-t border-border/20 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/settings" onClick={() => isMobile && onClose()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground hover:text-primary"
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
