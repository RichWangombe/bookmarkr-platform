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
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'list';
}

export function BookmarkCard({ bookmark, onEdit, size = 'medium', variant = 'default' }: BookmarkCardProps) {
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

  // Change some elements based on size and variant
  const getTitleMaxLength = () => {
    if (variant === 'list') return 100;
    switch (size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 60;
    }
  };
  
  const getDescriptionMaxLength = () => {
    if (variant === 'list') return 150;
    switch (size) {
      case 'small': return 60;
      case 'large': return 200;
      default: return 120;
    }
  };
  
  const getCardAnimationProps = () => {
    if (variant === 'list') {
      return {
        whileHover: { x: 5 }
      };
    }
    
    return {
      whileHover: { y: -5 }
    };
  };
  
  // Get aspect ratio based on size
  const getAspectRatio = () => {
    if (variant === 'list') return '';
    switch (size) {
      case 'small': return 'aspect-[4/3]';
      case 'large': return 'aspect-[16/9]';
      default: return 'aspect-video';
    }
  };
  
  if (variant === 'list') {
    return (
      <>
        <motion.div
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card className="overflow-hidden rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg shadow-sm bg-card/80 backdrop-blur-sm">
            <div className="flex">
              <div className="w-40 h-full bg-muted relative overflow-hidden flex-shrink-0">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={imageUrl} 
                    alt={bookmark.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </div>
              
              <div className="flex-1 p-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <img 
                        src={getBrowserIcon(domain)} 
                        alt={domain}
                        className="w-3 h-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://www.google.com/favicon.ico';
                        }}
                      />
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>{domain}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(bookmark.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="p-1 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background/90 transition-colors h-6 w-6"
                      onClick={handleToggleFavorite}
                      disabled={toggleFavoriteMutation.isPending}
                    >
                      {bookmark.favorite ? <i className="ri-star-fill text-yellow-500 text-xs"></i> : <i className="ri-star-line text-muted-foreground hover:text-yellow-500 text-xs"></i>}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="p-1 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background/90 transition-colors h-6 w-6"
                        >
                          <i className="ri-more-2-fill text-muted-foreground text-xs"></i>
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
                
                <h3 className="font-semibold text-foreground leading-tight mb-1">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {truncateText(bookmark.title, getTitleMaxLength())}
                  </a>
                </h3>
                
                {bookmark.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {truncateText(bookmark.description, getDescriptionMaxLength())}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center justify-between">
                  {bookmark.folder && (
                    <Badge 
                      variant="outline" 
                      className="bg-background/80 backdrop-blur-sm text-xs font-medium shadow-sm border-opacity-50 mr-2"
                      style={{ 
                        borderColor: bookmark.folder.color,
                        color: bookmark.folder.color,
                        backgroundColor: `${bookmark.folder.color}10`
                      }}
                    >
                      {bookmark.folder.name}
                    </Badge>
                  )}
                  
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {bookmark.tags.slice(0, 3).map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary"
                          className="bg-primary/15 text-primary hover:bg-primary/25 transition-colors backdrop-blur-sm text-xs"
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                      {bookmark.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{bookmark.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
  
  return (
    <>
      <motion.div
        {...getCardAnimationProps()}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className={`bookmark-card overflow-hidden rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg shadow-sm bg-card/80 backdrop-blur-sm ${size === 'large' ? 'h-full' : ''}`}>
          <div className={`${getAspectRatio()} bg-muted relative overflow-hidden`}>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              <img 
                src={imageUrl} 
                alt={bookmark.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=315&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            
            {bookmark.folder && (
              <div className="absolute top-2 left-2">
                <Badge 
                  variant="outline" 
                  className="bg-background/80 backdrop-blur-sm text-xs font-medium shadow-sm border-opacity-50"
                  style={{ 
                    borderColor: bookmark.folder.color,
                    color: bookmark.folder.color,
                    backgroundColor: `${bookmark.folder.color}10`
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
                className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background/90 transition-colors"
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
                  <i className="ri-star-line text-muted-foreground hover:text-yellow-500"></i>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background/90 transition-colors"
                  >
                    <i className="ri-more-2-fill text-muted-foreground"></i>
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
          
          <CardContent className={`${size === 'small' ? 'p-3' : 'p-5'}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex-shrink-0 ${size === 'small' ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-primary/10 flex items-center justify-center`}>
                <img 
                  src={getBrowserIcon(domain)} 
                  alt={domain}
                  className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.google.com/favicon.ico';
                  }}
                />
              </div>
              <div>
                <h3 className={`font-semibold text-foreground leading-tight mb-1 ${size === 'large' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-base'}`}>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {truncateText(bookmark.title, getTitleMaxLength())}
                  </a>
                </h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{domain}</span>
                  <span className="mx-1">•</span>
                  <span>{formatDate(bookmark.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {bookmark.description && (
              <p className={`text-muted-foreground ${size === 'small' ? 'text-xs line-clamp-1' : size === 'large' ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'} mb-4`}>
                {truncateText(bookmark.description, getDescriptionMaxLength())}
              </p>
            )}
            
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(size === 'small' ? bookmark.tags.slice(0, 2) : bookmark.tags).map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary"
                    className={`bg-primary/15 text-primary hover:bg-primary/25 transition-colors backdrop-blur-sm ${size === 'small' ? 'text-xs' : ''}`}
                  >
                    #{tag.name}
                  </Badge>
                ))}
                {size === 'small' && bookmark.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">+{bookmark.tags.length - 2}</Badge>
                )}
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
