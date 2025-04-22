import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number | null): string {
  if (!date) return 'Unknown date';
  
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  
  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getBrowserIcon(domain: string): string {
  if (!domain) return 'https://www.google.com/favicon.ico';
  
  // Clean up domain to get the root domain
  let cleanDomain = domain;
  if (cleanDomain.startsWith('www.')) {
    cleanDomain = cleanDomain.substring(4);
  }
  
  // Get favicon from Google's favicon service
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
}

export function getRandomColor(): string {
  const colors = [
    '#4A90E2', // primary blue
    '#6C63FF', // secondary purple
    '#4CAF50', // green
    '#FF5722', // orange
    '#9C27B0', // purple
    '#E91E63', // pink
    '#607D8B', // blue-grey
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Function to generate a consistent gradient for a given ID
export function getRandomGradient(id: number | string): string {
  // Use the id to generate a deterministic gradient
  const seed = typeof id === 'string' ? 
    id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    Number(id);

  // Base gradients with deep blues and dark theme-friendly colors
  const gradients = [
    'linear-gradient(135deg, #1a2a6c, #2a3a7c)',
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'linear-gradient(135deg, #12100e, #2c3e50)',
    'linear-gradient(135deg, #000428, #004e92)',
    'linear-gradient(135deg, #16222a, #3a6073)',
    'linear-gradient(135deg, #1e3c72, #2a5298)',
    'linear-gradient(135deg, #243949, #517fa4)',
    'linear-gradient(135deg, #141e30, #243b55)',
    'linear-gradient(135deg, #2b5876, #4e4376)',
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'linear-gradient(135deg, #000046, #1cb5e0)',
    'linear-gradient(135deg, #000000, #434343)'
  ];
  
  return gradients[seed % gradients.length];
}
