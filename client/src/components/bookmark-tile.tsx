import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ExternalLinkIcon, StarIcon, TagIcon } from "lucide-react";
import { BookmarkWithTags } from "@shared/schema";
import { getRandomGradient, formatDate } from "@/lib/utils";

interface BookmarkTileProps {
  bookmark: BookmarkWithTags;
  isCompact?: boolean;
  onBookmark?: (bookmark: BookmarkWithTags) => void;
  onTagClick?: (tagId: number) => void;
}

export function BookmarkTile({ 
  bookmark, 
  isCompact = false,
  onBookmark,
  onTagClick 
}: BookmarkTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageSrc = bookmark.imageUrl || 
    `https://source.unsplash.com/featured/?${encodeURIComponent(bookmark.title.split(' ').slice(0, 2).join(','))}`;
  
  // Use backdrop gradient when there's no image or placeholder
  const backdropStyle = !bookmark.imageUrl ? { 
    background: getRandomGradient(bookmark.id || 0) 
  } : {};
  
  // Source icon or placeholder
  const sourceIcon = bookmark.source?.iconUrl || 
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M12 16v-4'%3E%3C/path%3E%3Cpath d='M12 8h.01'%3E%3C/path%3E%3C/svg%3E";

  return (
    <motion.div 
      className={`bookmark-tile relative group overflow-hidden rounded-lg ${isCompact ? 'h-40' : 'h-64 md:h-72'} 
        shadow-md hover:shadow-xl transition-shadow duration-300 bg-card dark:bg-card`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image or gradient background */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105"
        style={{ 
          backgroundImage: bookmark.imageUrl ? `url(${imageSrc})` : undefined,
          ...backdropStyle
        }}
      />
      
      {/* Dark overlay on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      
      {/* Source badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center">
        <div className="h-6 w-6 rounded-full overflow-hidden border border-white/30 bg-black/20 backdrop-blur-sm">
          <img src={sourceIcon} alt={bookmark.source?.name || 'Source'} className="w-full h-full object-cover" />
        </div>
        
        {/* Show source name on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="ml-2 text-xs font-medium text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {bookmark.source?.name || 'Article'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Favorite button */}
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={() => onBookmark && onBookmark(bookmark)}
          className="bookmark-controls h-8 w-8 rounded-full flex items-center justify-center
            border border-white/20 text-white/80 hover:bg-primary/80 hover:text-white transition-colors"
        >
          {bookmark.favorite ? (
            <StarIcon key="star-icon" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ) : (
            <BookmarkIcon key="bookmark-icon" className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Content - only shown on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute inset-0 p-4 flex flex-col justify-end z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">{bookmark.title}</h3>
            
            {!isCompact && (
              <p className="text-white/80 text-sm line-clamp-2 mb-3">{bookmark.description}</p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-3">
              {bookmark.tags?.slice(0, isCompact ? 2 : 4).map(tag => (
                <span 
                  key={tag.id} 
                  className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm 
                    text-white rounded-full flex items-center cursor-pointer transition-colors"
                  onClick={() => onTagClick && onTagClick(tag.id)}
                >
                  <TagIcon key={`tag-icon-${tag.id}`} className="h-3 w-3 mr-1" />
                  <span key={`tag-name-${tag.id}`}>{tag.name}</span>
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">
                {formatDate(bookmark.createdAt || new Date())}
              </div>
              
              <a 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-white bg-primary/80 hover:bg-primary 
                  px-3 py-1.5 rounded-full transition-colors"
              >
                <span key="visit-text">Visit</span>
                <ExternalLinkIcon key="visit-icon" className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}