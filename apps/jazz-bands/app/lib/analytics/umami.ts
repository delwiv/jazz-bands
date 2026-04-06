/**
 * Umami tracking helper
 * Tracks events to self-hosted Umami analytics
 * Respects Do Not Track (DNT) browser setting
 */

// Extend Window type for Umami
declare global {
  interface Window {
    umami?: {
      trackEvent: (name: string, properties?: Record<string, string | number | boolean>) => void;
      trackPageView?: () => void;
    };
  }
}

/**
 * Track an event to Umami analytics
 * @param event - Event name (max 50 chars)
 * @param properties - Event properties (max 500 chars per string, 50 properties)
 */
export function trackUmamiEvent(
  event: string,
  properties?: Record<string, string | number | boolean>
): void {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Respect Do Not Track setting
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return;
  }

  // Use Umami's global object
  if (window.umami && typeof window.umami.trackEvent === 'function') {
    window.umami.trackEvent(event, properties);
  }
}

/**
 * Track a page view to Umami (manual tracking)
 * Use this when data-dom-auto={false} is set
 */
export function trackUmamiPageView(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return;
  }

  if (window.umami && typeof window.umami.trackPageView === 'function') {
    window.umami.trackPageView();
  }
}
