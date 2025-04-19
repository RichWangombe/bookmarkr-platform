import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, getDomainFromUrl, truncateText } from "@/lib/utils";
import { BookmarkWithTags } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
      <Card className="bookmark-card overflow-hidden transition-all duration-200 hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <div className="aspect-video bg-gray-100 relative">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <img 
              src={imageUrl} 
              alt={bookmark.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
              }}
            />
          </a>
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-colors"
              onClick={handleToggleFavorite}
              disabled={toggleFavoriteMutation.isPending}
            >
              {bookmark.favorite ? (
                <i className="ri-star-fill text-yellow-500"></i>
              ) : (
                <i className="ri-star-line text-text text-opacity-70 hover:text-yellow-500"></i>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-colors"
                >
                  <i className="ri-more-2-fill text-text text-opacity-70"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <i className="ri-edit-line mr-2"></i> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  <i className="ri-delete-bin-line mr-2"></i> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start mb-2">
            <div className="flex-shrink-0 w-6 h-6 mr-2 rounded bg-primary bg-opacity-10 flex items-center justify-center">
              <i className="ri-global-line text-primary text-sm"></i>
            </div>
            <h3 className="font-medium text-text leading-tight">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                {truncateText(bookmark.title, 60)}
              </a>
            </h3>
          </div>
          
          {bookmark.description && (
            <p className="text-text text-opacity-70 text-sm mb-3 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {bookmark.tags.map(tag => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary bg-opacity-10 text-primary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-text text-opacity-60">
            <span>{domain}</span>
            <span>{formatDate(bookmark.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

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
