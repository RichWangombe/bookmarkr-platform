import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Discover } from "@/components/discover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-3 md:p-6">
      <Tabs defaultValue="discover" className="w-full">
        <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-30 mb-3 pb-2">
          <TabsList className="mb-1">
            <TabsTrigger value="discover" className="text-base">News Feed</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-base">My Bookmarks</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="discover" className="mt-0">
          <Discover />
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-0">
          <Dashboard searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
