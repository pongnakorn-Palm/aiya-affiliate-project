import { lazy, ComponentType } from 'react';

/**
 * Wraps React.lazy() with retry logic to handle chunk loading failures
 * that occur after new deployments (when old chunk files no longer exist)
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = 'chunk_reload_timestamp';

    try {
      return await importFn();
    } catch (error) {
      const isChunkError =
        error instanceof Error &&
        (error.message.includes('Failed to fetch dynamically imported module') ||
         error.message.includes('Loading chunk') ||
         error.message.includes('Loading CSS chunk'));

      if (isChunkError) {
        // Check if we already tried reloading recently (within last 10 seconds)
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();

        if (lastReload && now - parseInt(lastReload) < 10000) {
          // Already tried reloading, don't get stuck in a loop
          throw error;
        }

        // Mark that we're about to reload
        sessionStorage.setItem(storageKey, now.toString());

        // Clear cache and reload to get the latest chunks
        window.location.reload();

        // Return a never-resolving promise while the page reloads
        return new Promise(() => {});
      }

      throw error;
    }
  });
}
