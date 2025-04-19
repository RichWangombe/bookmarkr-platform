import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useLocation } from "wouter";
import useMobile from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMobile();
  const [location, navigate] = useLocation();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Open sidebar by default on desktop
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // If we're not on the home page, navigate to it
    if (location !== "/") {
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          onMenuToggle={toggleSidebar} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
