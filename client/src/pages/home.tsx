import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Discover } from "@/components/discover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="dashboard">My Bookmarks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover">
          <h1 className="text-3xl font-bold mb-6">Discover</h1>
          <Discover />
        </TabsContent>
        
        <TabsContent value="dashboard">
          <h1 className="text-3xl font-bold mb-6">My Bookmarks</h1>
          <Dashboard searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
