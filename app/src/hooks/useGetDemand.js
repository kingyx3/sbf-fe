import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";

const CONFIG = {
  COLLECTION_NAME: "demand",
  QUERY_KEY_PREFIX: "demandData",
  STALE_TIME: 30 * 60 * 1000, // 30 minutes - increased to match CSV for consistency
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

/**
 * Fetches demand data from Firestore
 */
const fetchDemandData = async (sbfCode) => {
  if (!sbfCode) {
    throw new Error("SBF code is required");
  }

  const startTime = performance.now();

  const demandQuery = query(
    collection(db, CONFIG.COLLECTION_NAME),
    where("sbfCode", "==", sbfCode),
    orderBy("__name__", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(demandQuery);
  const latestDoc = snapshot.docs[0];

  if (!latestDoc) {
    // Return empty data instead of throwing error when no demand data exists
    // This allows the dashboard to display supply data even without demand data
    return {
      demandData: [],
      capturedAt: null,
    };
  }

  const docData = latestDoc.data();
  const demand = docData.data || [];
  let capturedAt = docData.capturedAt;

  // Format the captured timestamp
  capturedAt = capturedAt
    ? new Date(capturedAt.toDate ? capturedAt.toDate() : capturedAt)
        .toLocaleDateString("en-GB", { 
          day: "2-digit", 
          month: "short", 
          year: "numeric", 
          hour: "numeric", 
          hour12: true 
        })
        .replace(", ", " ")
        .replace(/ (\d{1,2})(AM|PM)/, "$1$2")
    : null;

  if (envVars.REACT_APP_DEBUG) {
    const elapsedTime = Math.round(performance.now() - startTime);
    console.log(`[Demand] fetch for ${sbfCode} took ${elapsedTime} ms`);
  }

  // Log loaded demand data with details
  if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
    console.log(`[Demand] Demand data loaded for sbfcode: ${sbfCode} (${demand.length} records)`);
  }

  return {
    demandData: demand,
    capturedAt,
  };
};

const useGetDemand = (sbfCode) => {
  // Handle test mode
  if (envVars.testMode) {
    return {
      demandData: [{ sbfCode, value: 42 }],
      capturedAt: null,
      isLoading: false,
      error: null,
    };
  }

  // Use React Query for better network handling
  const queryResult = useQuery({
    queryKey: [CONFIG.QUERY_KEY_PREFIX, sbfCode],
    queryFn: () => fetchDemandData(sbfCode),
    enabled: !!sbfCode,
    staleTime: CONFIG.STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Retry when network reconnects
    retry: (failureCount, error) => {
      if (failureCount >= CONFIG.MAX_RETRIES) return false;
      
      // Don't retry on certain errors
      if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      const baseDelay = CONFIG.RETRY_DELAY * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000;
      return Math.min(baseDelay + jitter, 30000);
    },
    onError: (error) => {
      console.error(`[useGetDemand] Error:`, error);
      console.error("Network status:", navigator.onLine ? 'online' : 'offline');
    },
  });

  return {
    demandData: queryResult.data?.demandData || [],
    capturedAt: queryResult.data?.capturedAt || null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isFetching: queryResult.isFetching,
    isRefetching: queryResult.isRefetching,
  };
};

export default useGetDemand;
