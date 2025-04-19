import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Discover } from "@/components/discover";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-4 md:p-6">
      <Dashboard searchQuery={searchQuery} />
      <Discover />
    </div>
  );
}
