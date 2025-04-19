import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
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
  const commonBrowsers = [
    { domain: 'chrome', icon: 'ri-chrome-fill' },
    { domain: 'firefox', icon: 'ri-firefox-fill' },
    { domain: 'safari', icon: 'ri-safari-fill' },
    { domain: 'edge', icon: 'ri-edge-fill' },
    { domain: 'opera', icon: 'ri-opera-fill' },
  ];
  
  const match = commonBrowsers.find(browser => 
    domain.toLowerCase().includes(browser.domain)
  );
  
  return match ? match.icon : 'ri-global-line';
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
