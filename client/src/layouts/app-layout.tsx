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
      {/* Mobile menu toggle button */}
      {isMobile && (
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            id="menuToggle"
            className="p-2 rounded-md bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-text"
            onClick={toggleSidebar}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-accent">
        <Header 
          onMenuToggle={toggleSidebar} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
        {children}
      </main>
    </div>
  );
}
