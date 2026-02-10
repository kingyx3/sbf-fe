import { useQuery } from "@tanstack/react-query";
import { functions } from "../config/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import testData from "../config/testData";
import { envVars } from "../config/envConfig";
import {
  getCSVFromIndexedDB,
  saveCSVToIndexedDB,
} from "../utils/indexedDB";

const CONFIG = {
  CACHE_TTL: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  STALE_TIME: 30 * 60 * 1000, // 30 minutes - increased to reduce mobile tab refresh frequency
  FUNCTION_NAME: "getCsvFile",
  QUERY_KEY_PREFIX: "csvData",
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // Base retry delay in ms
};

/**
 * Fetches CSV data from IndexedDB cache or Firebase Functions
 * Implements stale-while-revalidate pattern for better UX
 */
const fetchCSV = async ({ userId, paymentDocCount, allowStale = true }) => {
  // Try to get from cache first
  try {
    const cachedData = await fetchFromCache(userId, paymentDocCount, allowStale);
    if (cachedData) {
      // If we're allowing stale data and have it, return it immediately
      // The query will run in background to update the cache
      if (allowStale || !isCacheStale(cachedData.timestamp)) {
        return cachedData.data;
      }
    }
  } catch (err) {
    logWarning("Failed to fetch from IndexedDB cache. Will refetch.", err);
  }

  // Fetch from Firebase if cache miss or error
  return fetchFromFirebase(userId, paymentDocCount);
};

/**
 * Check if cached data is stale but still usable
 */
const isCacheStale = (timestamp) => {
  const now = Date.now();
  const age = now - timestamp;
  return age > CONFIG.CACHE_TTL;
};

/**
 * Attempts to fetch CSV data from IndexedDB cache
 * Now supports returning stale data for better UX
 */
const fetchFromCache = async (userId, paymentDocCount, allowStale = true) => {
  const cached = await getCSVFromIndexedDB(userId, paymentDocCount, allowStale ? Infinity : CONFIG.CACHE_TTL);
  if (cached) {
    logDebug("✅ Loaded CSV from IndexedDB cache.");
    // Handle both old format (just data) and new format (with timestamp)
    if (cached.data && cached.timestamp) {
      return cached;
    } else {
      // Fallback for old cache format
      return {
        data: cached,
        timestamp: Date.now()
      };
    }
  }
  
  logDebug("🔄 No valid cache or cache expired.");
  return null;
};

/**
 * Fetches CSV data from Firebase Functions and updates cache
 */
const fetchFromFirebase = async (userId, paymentDocCount) => {
  const startTime = performance.now();
  logDebug("🚀 Fetching CSV from Firebase Functions...");

  try {
    const getCSVFile = httpsCallable(functions, CONFIG.FUNCTION_NAME);
    const response = await getCSVFile();
    
    if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
      console.log('[useFetchCSV] Firebase response:', {
        hasData: !!response?.data,
        dataStructure: response?.data ? Object.keys(response.data) : 'no data',
        dataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'not array'
      });
    }
    
    const rawData = response?.data?.data;

    if (!rawData || !Array.isArray(rawData)) {
      const errorDetails = {
        hasResponse: !!response,
        hasData: !!response?.data,
        rawDataType: typeof rawData,
        rawDataValue: rawData,
        isArray: Array.isArray(rawData)
      };
      console.error('[useFetchCSV] Invalid data structure received:', errorDetails);
      throw new Error(`Invalid data returned from server: ${JSON.stringify(errorDetails)}`);
    }

    if (rawData.length === 0 && (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development')) {
      console.warn('[useFetchCSV] Empty data array received from server');
    }

    // Save to cache
    await saveCSVToIndexedDB(userId, rawData, paymentDocCount);

    const fetchTime = Math.round(performance.now() - startTime);
    logDebug(`✅ Fetched from Firebase in ${fetchTime} ms`);

    // Log loaded supply data with sbfcodes
    if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
      const sbfCodeCounts = new Map();
      rawData.forEach(item => {
        if (item.sbfCode) {
          sbfCodeCounts.set(item.sbfCode, (sbfCodeCounts.get(item.sbfCode) || 0) + 1);
        }
      });
      const recordCounts = Array.from(sbfCodeCounts.entries())
        .map(([code, count]) => `${code} (${count} units)`)
        .join(', ');
      console.log(`[CSV] Supply data loaded for ${sbfCodeCounts.size} sbfcode(s): ${recordCounts}`);
    }

    return rawData;
  } catch (error) {
    console.error('[useFetchCSV] Firebase fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details || 'no details',
      userId,
      paymentDocCount
    });
    throw error;
  }
};

/**
 * Custom hook for fetching CSV data with caching
 */
const useFetchCSV = ({ enabled = true, userId, paymentDocCount }) => {
  const shouldFetch = !envVars.testMode && enabled;

  logDebug(`Init | enabled: ${enabled}, userId: ${userId}, docCount: ${paymentDocCount}`);

  // Handle test mode
  if (envVars.testMode) {
    logDebug("🧪 Test mode enabled – using local test data.");
    return {
      data: testData,
      isLoading: false,
      error: null,
    };
  }

  // Use react-query for data fetching with improved network handling
  const queryResult = useQuery({
    queryKey: [CONFIG.QUERY_KEY_PREFIX, userId, paymentDocCount],
    queryFn: () => fetchCSV({ userId, paymentDocCount }),
    enabled: shouldFetch && !!userId && paymentDocCount !== null,
    staleTime: CONFIG.STALE_TIME, // Data is fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // DO refetch when network reconnects
    retry: (failureCount, error) => {
      // Retry logic with exponential backoff
      if (failureCount >= CONFIG.MAX_RETRIES) return false;
      
      // Don't retry on certain errors (like 403, 401)
      if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter
      const baseDelay = CONFIG.RETRY_DELAY * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000; // Add up to 1s random delay
      return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
    },
    onSuccess: () => logDebug("✅ useQuery succeeded – CSV data available."),
    onError: (error) => {
      logError("❌ useQuery error:", error);
      // Log additional context for debugging
      logError("Network status:", navigator.onLine ? 'online' : 'offline');
    },
  });

  return {
    ...queryResult,
    // Add helper properties for better UX
    isStale: queryResult.isStale,
    isFetching: queryResult.isFetching,
    isRefetching: queryResult.isRefetching,
  };
};

/**
 * Helper functions for logging
 */
const logDebug = (message, data) => {
  if (envVars.REACT_APP_DEBUG) {
    console.log(`[CSV] ${message}`, data || "");
  }
};

const logWarning = (message, error) => {
  console.warn(`[CSV] ⚠️ ${message}`, error);
};

const logError = (message, error) => {
  console.error(`[CSV] ${message}`, error);
};

export default useFetchCSV;