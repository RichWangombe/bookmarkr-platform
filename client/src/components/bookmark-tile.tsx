import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, getDomainFromUrl, truncateText, getBrowserIcon } from "@/lib/utils";
import { BookmarkWithTags } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BookmarkTileProps {
  bookmark: BookmarkWithTags;
  onEdit?: (bookmark: BookmarkWithTags) => void;
  size?: 'small' | 'medium' | 'large';
}

export function BookmarkTile({ bookmark, onEdit, size = 'medium' }: BookmarkTileProps) {
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/bookmarks/${bookmark.id}`, {
        favorite: !bookmark.favorite,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: bookmark.favorite ? "Removed from favorites" : "Added to favorites",
        description: bookmark.title,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/bookmarks/${bookmark.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: "Bookmark deleted",
        description: bookmark.title,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(bookmark);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteAlert(false);
  };

  // Use thumbnail URL if available, otherwise use imageUrl field that's added from RSS/crawler
  const imageUrl = bookmark.thumbnailUrl || bookmark.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
  
  // Get domain if not already provided
  const domain = bookmark.domain || getDomainFromUrl(bookmark.url);

  // Helper functions for text length based on size
  const getTitleMaxLength = () => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };
  
  const getDescriptionMaxLength = () => {
    switch (size) {
      case 'small': return 60;
      case 'large': return 200;
      default: return 120;
    }
  };
  
  // Get aspect ratio based on size
  const getAspectRatio = () => {
    switch (size) {
      case 'small': return 'aspect-[1/1]';
      case 'large': return 'aspect-[16/9]';
      default: return 'aspect-[4/3]';
    }
  };

  // Get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return "border-gray-500";
    
    switch(category.toLowerCase()) {
      case 'technology': 
        return 'border-blue-500';
      case 'business': 
        return 'border-green-500';
      case 'design': 
        return 'border-purple-500';
      case 'science': 
        return 'border-yellow-500';
      case 'ai': 
        return 'border-red-500';
      case 'news': 
        return 'border-orange-500';
      default: 
        return 'border-gray-500';
    }
  };

  // Visual tile model layout with hover effects - minimalist approach
  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="h-full"
      >
        <Card className={`bookmark-tile group relative overflow-hidden rounded-xl border-0 transition-all duration-300 hover:shadow-xl shadow-md h-full ${getCategoryColor(bookmark.category)} hover:border-l-2 border-l border-l-transparent`}>
          {/* Pure image background */}
          <div className="absolute inset-0 w-full h-full bg-black">
            <img 
              src={imageUrl} 
              alt={bookmark.title} 
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 scale-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
              }}
            />
          </div>
          
          {/* Action buttons at top right - only visible on hover */}
          <div className="absolute top-3 right-3 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              variant="ghost" 
              size="icon"
              className="p-1.5 bg-black/60 backdrop-blur-md rounded-full shadow-sm hover:bg-black/70 transition-colors border border-white/10"
              onClick={handleToggleFavorite}
              disabled={toggleFavoriteMutation.isPending}
            >
              {bookmark.favorite ? (
                <motion.i 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="ri-star-fill text-yellow-500"
                />
              ) : (
                <i className="ri-star-line text-white/80 hover:text-yellow-500"></i>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="p-1.5 bg-black/60 backdrop-blur-md rounded-full shadow-sm hover:bg-black/70 transition-colors border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="ri-more-2-fill text-white/80"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <i className="ri-edit-line mr-2"></i> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500 cursor-pointer">
                  <i className="ri-delete-bin-line mr-2"></i> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Content overlay that ONLY appears on hover */}
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block h-full">
            <div className={`${getAspectRatio()} relative z-0`}>
              {/* Invisible spacer div to maintain aspect ratio */}
              <div className="w-full h-full"></div>
              
              {/* Hover overlay with all text info */}
              <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Source info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md p-1 flex items-center justify-center border border-white/10">
                    <img 
                      src={getBrowserIcon(domain)} 
                      alt={domain}
                      className="w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/favicon.ico';
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/70">{domain}</span>
                </div>
                
                {/* Title and description */}
                <h3 className={`font-medium text-white leading-tight ${size === 'large' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-base'}`}>
                  {truncateText(bookmark.title, getTitleMaxLength())}
                </h3>
                
                {bookmark.description && (
                  <p className="text-white/70 text-xs mt-2 line-clamp-2">
                    {truncateText(bookmark.description, getDescriptionMaxLength())}
                  </p>
                )}
                
                {/* Folder badge */}
                {bookmark.folder && (
                  <Badge 
                    variant="outline" 
                    className="mt-2 w-fit bg-black/50 backdrop-blur-md text-xs font-normal shadow-sm border-opacity-50"
                    style={{ 
                      borderColor: bookmark.folder.color,
                      color: bookmark.folder.color,
                    }}
                  >
                    {bookmark.folder.name}
                  </Badge>
                )}
                
                {/* Date and tags */}
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-white/50">{formatDate(bookmark.createdAt)}</span>
                  
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {bookmark.tags.slice(0, 2).map(tag => (
                        <Badge 
                          key={tag.id}
                          variant="secondary"
                          className="bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-md text-xs"
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                      {bookmark.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs text-white/80 border-white/20">+{bookmark.tags.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </a>
        </Card>
      </motion.div>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bookmark.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}