/**
 * Umami tracking helper
 * Tracks events to self-hosted Umami analytics
 * Note: We track based on legitimate interest (GDPR Art. 6(1)(f)) for site optimization
 * This is a privacy-friendly approach that does not require consent
 */

// Extend Window type for Umami
declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        eventData?: Record<string, string | number | boolean>
      ) => void;
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

  // Track events - we use legitimate interest for analytics
  if (window.umami && typeof window.umami.track === 'function') {
    window.umami.track(event, properties);
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

  if (window.umami && typeof window.umami.trackPageView === 'function') {
    window.umami.trackPageView();
  }
}
