import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL of the application
 * Used for generating absolute URLs for assets like logos in emails
 */
export function getAppUrl(): string {
  // In production, use the environment variable or default to drag.email domain
  if (typeof window === "undefined") {
    // Server-side: use environment variable or default
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_URL) {
      // VERCEL_URL doesn't include protocol, add it
      return `https://${process.env.VERCEL_URL}`;
    }
    // Default fallback
    return "https://drag.email";
  }
  
  // Client-side: use current origin
  return window.location.origin;
}

/**
 * Get the logo URL - converts relative paths to absolute URLs
 * @param logoPath - Relative path like "/logo.png" or absolute URL
 * @returns Absolute URL for the logo
 */
export function getLogoUrl(logoPath: string = "/logo.png"): string {
  // If it's already an absolute URL, return as is
  if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
    return logoPath;
  }
  
  // Convert relative path to absolute URL
  const baseUrl = getAppUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanPath = logoPath.startsWith("/") ? logoPath.slice(1) : logoPath;
  return `${baseUrl}/${cleanPath}`;
}

