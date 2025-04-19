import { usePersonalizedRecommendations, useDiscoveryRecommendations } from "@/hooks/use-recommendations";
import { Recommendation } from "../types/recommendations";
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
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <h2 className="text-xl font-medium text-primary">Recommendations</h2>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-auto"
        >
          <TabsList className="h-9 bg-background/50 backdrop-blur-sm border">
            <TabsTrigger value="personalized" className="text-sm px-3 h-8">
              <Stars size={14} className="mr-1.5" />
              <span>For You</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-sm px-3 h-8">
              <TrendingUp size={14} className="mr-1.5" />
              <span>Discover</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="personalized">
        <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoadingPersonalized ? (
            Array.from({ length: 10 }).map((_, i) => (
              <RecommendationSkeleton key={i} />
            ))
          ) : personalizedError ? (
            <div className="col-span-full p-8 text-center">
              <p className="text-destructive">Failed to load recommendations.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try refreshing the page.
              </p>
            </div>
          ) : personalizedRecommendations?.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <p>No personalized recommendations found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Save bookmarks to get personalized recommendations.
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
      
      <TabsContent value="discover">
        <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoadingDiscovery ? (
            Array.from({ length: 10 }).map((_, i) => (
              <RecommendationSkeleton key={i} />
            ))
          ) : discoveryError ? (
            <div className="col-span-full p-8 text-center">
              <p className="text-destructive">Failed to load discovery items.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try refreshing the page.
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
    </div>
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
    <div className="relative group overflow-hidden rounded-xl hover:shadow-lg transition-all duration-300">
      {/* Image container with fixed height */}
      <div 
        className="w-full h-48 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${recommendation.imageUrl || recommendation.thumbnailUrl || '/placeholder.jpg'})`,
          backgroundSize: 'cover'
        }}
      >
      </div>
      
      {/* Overlay that appears on hover with text information */}
      <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="text-white font-medium line-clamp-2 mb-1">{recommendation.title}</h3>
        <p className="text-white/70 text-xs line-clamp-2">{recommendation.description}</p>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-white/60">{recommendation.source}</span>
          <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white">
            <BookmarkPlus size={12} className="mr-1" /> Save
          </Badge>
        </div>
        
        {/* Category and relevance score badges */}
        <div className="absolute top-2 left-2">
          {recommendation.category && (
            <Badge variant="outline" className="bg-black/50 backdrop-blur-sm text-white border-none">
              {recommendation.category}
            </Badge>
          )}
        </div>
        
        {recommendation.relevanceScore && recommendation.relevanceScore > 30 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-primary/70 backdrop-blur-sm text-white">
              <Sparkles size={12} className="mr-1 text-amber-300" /> 
              {Math.floor(recommendation.relevanceScore)}% Match
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton className="h-48 w-full" />
    </div>
  );
}