import { useEffect, useState } from "react";
import { BookmarkWithTags } from "@shared/schema";
import { BookmarkTile } from "./bookmark-tile";

interface MasonryGridProps {
  items: BookmarkWithTags[];
  columns?: number;
  gap?: number;
  onBookmark?: (bookmark: BookmarkWithTags) => void;
  onTagClick?: (tagId: number) => void;
}

export function MasonryGrid({
  items,
  columns = 3,
  gap = 16,
  onBookmark,
  onTagClick
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(columns);
  
  // Responsive column count based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1); // Mobile: 1 column
      } else if (width < 1024) {
        setColumnCount(2); // Tablet: 2 columns
      } else {
        setColumnCount(columns); // Desktop: use prop value
      }
    };
    
    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);
  
  // Create column arrays
  const createColumnArrays = () => {
    const cols: BookmarkWithTags[][] = Array.from({ length: columnCount }, () => []);
    
    // Distribute items evenly across columns
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      cols[columnIndex].push(item);
    });
    
    return cols;
  };
  
  const columnArrays = createColumnArrays();
  
  return (
    <div 
      className="w-full"
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {columnArrays.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col" style={{ gap: `${gap}px` }}>
          {column.map((item) => (
            <BookmarkTile
              key={item.id}
              bookmark={item}
              onBookmark={onBookmark}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}