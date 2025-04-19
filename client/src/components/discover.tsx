import { useQuery } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/recommendation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function Discover() {
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['/api/recommendations'],
  });

  return (
    <section className="mt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Discover</h2>
        <Button variant="link" className="text-primary font-medium text-sm p-0">
          View more recommendations
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-[300px]">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          Error loading recommendations. Please try again.
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation: any) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      ) : (
        <div className="bg-accent p-8 rounded-md text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
          <p className="text-text text-opacity-70 mb-4">
            Save more bookmarks to get personalized recommendations.
          </p>
        </div>
      )}
    </section>
  );
}
