import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, getDomainFromUrl, truncateText, getBrowserIcon } from "@/lib/utils";
import { BookmarkWithTags } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BookmarkCardProps {
  bookmark: BookmarkWithTags;
  onEdit?: (bookmark: BookmarkWithTags) => void;
}

export function BookmarkCard({ bookmark, onEdit }: BookmarkCardProps) {
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

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleEdit = () => {
    if (onEdit) onEdit(bookmark);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteAlert(false);
  };

  // Default image if none provided
  const imageUrl = bookmark.thumbnailUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
  
  // Get domain if not already provided
  const domain = bookmark.domain || getDomainFromUrl(bookmark.url);

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className="bookmark-card overflow-hidden rounded-xl border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
          <div className="aspect-video bg-gray-100 relative overflow-hidden">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              <img 
                src={imageUrl} 
                alt={bookmark.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            
            {bookmark.folder && (
              <div className="absolute top-2 left-2">
                <Badge 
                  variant="outline" 
                  className="bg-white/90 backdrop-blur-sm text-xs font-medium shadow-sm"
                  style={{ 
                    borderColor: bookmark.folder.color,
                    color: bookmark.folder.color
                  }}
                >
                  {bookmark.folder.name}
                </Badge>
              </div>
            )}
            
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
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
                  <i className="ri-star-line text-gray-700/70 hover:text-yellow-500"></i>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                  >
                    <i className="ri-more-2-fill text-gray-700/70"></i>
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
          </div>
          
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <img 
                  src={getBrowserIcon(domain)} 
                  alt={domain}
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.google.com/favicon.ico';
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight mb-1">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {truncateText(bookmark.title, 60)}
                  </a>
                </h3>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{domain}</span>
                  <span className="mx-1">•</span>
                  <span>{formatDate(bookmark.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {bookmark.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {bookmark.description}
              </p>
            )}
            
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {bookmark.tags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary"
                    className="bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
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
