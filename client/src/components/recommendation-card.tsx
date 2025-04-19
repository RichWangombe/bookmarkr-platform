import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { truncateText } from "@/lib/utils";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
  source: string;
  readTime: string;
  type: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { toast } = useToast();
  
  const addBookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/bookmarks', {
        title: recommendation.title,
        url: recommendation.url,
        description: recommendation.description,
        thumbnailUrl: recommendation.thumbnailUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: "Bookmark added",
        description: recommendation.title,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bookmark-card overflow-hidden transition-all duration-200 hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="aspect-video bg-gray-100 relative">
        <a href={recommendation.url} target="_blank" rel="noopener noreferrer">
          <img 
            src={recommendation.thumbnailUrl} 
            alt={recommendation.title} 
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
            onClick={() => addBookmarkMutation.mutate()}
            disabled={addBookmarkMutation.isPending}
          >
            <i className="ri-add-line text-primary"></i>
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-text mb-2 leading-tight">
          <a href={recommendation.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {truncateText(recommendation.title, 60)}
          </a>
        </h3>
        
        <p className="text-text text-opacity-70 text-sm mb-3 line-clamp-2">
          {recommendation.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {recommendation.source.includes('Popular') ? (
              <i className="ri-fire-fill text-orange-500 mr-1"></i>
            ) : recommendation.source.includes('Based') ? (
              <i className="ri-bookmark-line text-secondary mr-1"></i>
            ) : (
              <i className="ri-group-line text-green-500 mr-1"></i>
            )}
            <span className="text-xs text-text text-opacity-60">{recommendation.source}</span>
          </div>
          <span className="text-xs text-text bg-accent px-2 py-0.5 rounded">{recommendation.readTime}</span>
        </div>
      </CardContent>
    </Card>
  );
}
