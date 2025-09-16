import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";

const CONFIG = {
  LOCAL_STORAGE_KEY: "cachedSbfCodes",
  CACHE_TTL_MS: 2 * 24 * 60 * 60 * 1000,
  SYSTEM_DOC_PATH: "system",
  SYSTEM_DOC_ID: "config",
};

const useListSbfCodes = () => {
  const [state, setState] = useState({
    dashboards: [],
    isLoading: !envVars.testMode,
    error: null,
  });

  useEffect(() => {
    if (envVars.testMode) {
      setState({
        dashboards: [
          { name: "Feb2025", preOrder: false },
          { name: "Jul2025", preOrder: true },
        ],
        isLoading: false,
        error: null,
      });
      return;
    }

    const fetchSbfCodes = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      const startTime = performance.now();

      try {
        const cachedData = checkCache();
        if (cachedData) {
          setState({
            dashboards: cachedData,
            isLoading: false,
            error: null,
          });
          return;
        }

        const data = await fetchFromFirestore();
        updateCache(data);

        setState({
          dashboards: data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("[useListSbfCodes] Firestore fetch error:", err);
        setState({
          dashboards: [],
          isLoading: false,
          error: err.message,
        });
      }

      logPerformance(startTime);
    };

    fetchSbfCodes();
  }, []);

  const checkCache = () => {
    const cached = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CONFIG.CACHE_TTL_MS) {
      return data;
    }
    return null;
  };

  const fetchFromFirestore = async () => {
    const systemDocRef = doc(db, CONFIG.SYSTEM_DOC_PATH, CONFIG.SYSTEM_DOC_ID);
    const docSnap = await getDoc(systemDocRef);

    if (!docSnap.exists()) {
      throw new Error("System config document not found.");
    }

    const sbfCodes = docSnap.data().sbfCodes || [];

    return sbfCodes
  };

  const updateCache = (data) => {
    localStorage.setItem(
      CONFIG.LOCAL_STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  };

  const logPerformance = (startTime) => {
    if (envVars.REACT_APP_DEBUG) {
      const elapsedTime = Math.round(performance.now() - startTime);
      console.log(`[SbfCodes] fetch took ${elapsedTime} ms`);
    }
  };

  return {
    dashboards: state.dashboards,
    isLoading: state.isLoading,
    error: state.error,
  };
};

export default useListSbfCodes;
