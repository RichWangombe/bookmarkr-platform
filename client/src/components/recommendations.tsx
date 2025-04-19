import { usePersonalizedRecommendations, useDiscoveryRecommendations } from "@/hooks/use-recommendations";
import { Recommendation } from "../../shared/types";
import { Card } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useState } from "react";
import { BookmarkTile } from "./bookmark-tile";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, Sparkles, Stars, TrendingUp } from "lucide-react";

export function RecommendationsSection() {
  const [activeTab, setActiveTab] = useState("personalized");
  const [limit, setLimit] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    data: personalizedRecommendations,
    isLoading: isLoadingPersonalized,
    error: personalizedError
  } = usePersonalizedRecommendations(limit);
  
  const {
    data: discoveryRecommendations,
    isLoading: isLoadingDiscovery,
    error: discoveryError
  } = useDiscoveryRecommendations(limit);
  
  return (
    <Card className="p-4 rounded-xl shadow-lg bg-primary-foreground/30 backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2 text-primary flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" /> Recommendations
        </h2>
        <p className="text-sm text-muted-foreground">
          Content curated just for you based on your reading preferences.
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-4"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="personalized" className="flex items-center gap-2">
            <Stars size={16} />
            <span>For You</span>
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Discover</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personalized" className="mt-2">
          <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingPersonalized ? (
              Array.from({ length: 8 }).map((_, i) => (
                <RecommendationSkeleton key={i} />
              ))
            ) : personalizedError ? (
              <div className="col-span-full p-8 text-center">
                <p className="text-destructive">Failed to load recommendations.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try refreshing the page or come back later.
                </p>
              </div>
            ) : personalizedRecommendations?.length === 0 ? (
              <div className="col-span-full p-8 text-center">
                <p>No personalized recommendations found.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start saving some bookmarks to get personalized recommendations!
                </p>
              </div>
            ) : (
              personalizedRecommendations?.map((recommendation) => (
                <RecommendationItem 
                  key={`personalized-${recommendation.id}`} 
                  recommendation={recommendation} 
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="discover" className="mt-2">
          <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingDiscovery ? (
              Array.from({ length: 8 }).map((_, i) => (
                <RecommendationSkeleton key={i} />
              ))
            ) : discoveryError ? (
              <div className="col-span-full p-8 text-center">
                <p className="text-destructive">Failed to load discovery items.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try refreshing the page or come back later.
                </p>
              </div>
            ) : discoveryRecommendations?.length === 0 ? (
              <div className="col-span-full p-8 text-center">
                <p>No discovery recommendations found.</p>
              </div>
            ) : (
              discoveryRecommendations?.map((recommendation) => (
                <RecommendationItem 
                  key={`discovery-${recommendation.id}`} 
                  recommendation={recommendation}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

interface RecommendationItemProps {
  recommendation: Recommendation;
}

function RecommendationItem({ recommendation }: RecommendationItemProps) {
  // Convert recommendation to bookmark format for BookmarkTile
  const bookmark = {
    id: recommendation.id,
    title: recommendation.title,
    description: recommendation.description,
    url: recommendation.url,
    thumbnailUrl: recommendation.thumbnailUrl || null,
    domain: recommendation.source,
    createdAt: new Date(),
    updatedAt: new Date(),
    folderId: null,
    favorite: false,
    tags: [{ id: 0, name: 'recommended', createdAt: new Date() }], // Need tags with proper structure
    folder: undefined, // Use undefined instead of null for optional property
    category: recommendation.category,
    source: {
      id: "rec-" + recommendation.id,
      name: recommendation.source,
    },
    imageUrl: recommendation.imageUrl || null,
  };
  
  return (
    <div className="relative group">
      <BookmarkTile bookmark={bookmark} />
      
      <div className="absolute top-2 right-2 transition-opacity opacity-0 group-hover:opacity-100">
        <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70">
          <BookmarkPlus size={12} className="mr-1" /> Save
        </Badge>
      </div>
      
      {recommendation.category && (
        <div className="absolute top-2 left-2 transition-opacity opacity-0 group-hover:opacity-100">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-sm text-white border-none">
            {recommendation.category}
          </Badge>
        </div>
      )}
      
      {recommendation.relevanceScore && recommendation.relevanceScore > 30 && (
        <div className="absolute bottom-2 right-2 transition-opacity opacity-0 group-hover:opacity-100">
          <Badge variant="secondary" className="bg-primary/70 backdrop-blur-sm text-white">
            <Sparkles size={12} className="mr-1 text-amber-300" /> 
            {Math.floor(recommendation.relevanceScore)}% Match
          </Badge>
        </div>
      )}
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden">
      <Skeleton className="h-40 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}