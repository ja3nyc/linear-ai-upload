/**
 * Get the base URL for the application.
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL - Custom app URL (includes protocol)
 * 2. VERCEL_URL - Vercel deployment URL (needs https:// prefix)
 * 3. window.location.origin - Browser's location (client-side fallback)
 */
export function getBaseUrl(): string {
    // First priority: explicitly set app URL
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Second priority: Vercel URL (add https:// since it's not included)
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Client-side fallback: use browser's location
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Fallback for local development
    return 'http://localhost:3000';
} 