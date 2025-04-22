import { useState } from "react";
import { motion } from "framer-motion";
import { Dashboard } from "@/components/dashboard";
import { NewsFeed } from "@/components/news-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Bookmark, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <Tabs 
        defaultValue="discover" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        {/* Header with tabs and search */}
        <div className="border-b sticky top-0 bg-background/95 backdrop-blur-md z-30 mb-6 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <TabsList className="h-auto">
              <TabsTrigger value="discover" className="text-base">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Discover</span>
                <span className="sm:hidden">News</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="text-base">
                <Bookmark className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">My Bookmarks</span>
                <span className="sm:hidden">Saved</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 h-9 bg-background border border-input hover:border-accent focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Content areas */}
        <TabsContent value="discover" className="mt-0 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <NewsFeed />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-0 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard searchQuery={searchQuery} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
