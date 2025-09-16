import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Create QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Better defaults for network resilience
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
          return false;
        }
        // Retry up to 3 times for network errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch when network comes back
      // Keep background refetches but make them less aggressive
      refetchInterval: false, // Don't auto-refetch by default
      refetchIntervalInBackground: false,
    },
  },
});

// Set up persistence
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

export default queryClient;