import Dexie from "dexie";
import { envVars } from "../config/envConfig";

export const db = new Dexie("CacheDB");

db.version(1).stores({
  csvCache: "&userId", // Only one entry per user
});

export const saveCSVToIndexedDB = async (userId, data, paymentDocCount) => {
  return db.csvCache.put({
    userId,
    data,
    timestamp: Date.now(),
    paymentDocCount,
  });
};

export const getCSVFromIndexedDB = async (userId, paymentDocCount, TTL) => {
  const cached = await db.csvCache.get(userId);
  if (!cached) {
    console.log(`[IndexedDB] ❌ No cache found for userId: ${userId}`);
    return null;
  }

  const { data, timestamp, paymentDocCount: savedCount } = cached;
  const now = Date.now();

  if (savedCount !== paymentDocCount) {
    if (envVars.REACT_APP_DEBUG) console.log(`[IndexedDB] ⛔ paymentDocCount mismatch. Saved: ${savedCount}, Current: ${paymentDocCount}`);
    return null;
  }

  if (!Array.isArray(data)) {
    if (envVars.REACT_APP_DEBUG) console.warn(`[IndexedDB] ⚠️ Cached data is not an array.`);
    return null;
  }

  if (TTL !== Infinity && now - timestamp >= TTL) {
    if (envVars.REACT_APP_DEBUG) console.log(`[IndexedDB] ⏰ Cache expired for userId: ${userId}`);
    return null;
  }

  if (envVars.REACT_APP_DEBUG) {
    const ageInMinutes = Math.round((now - timestamp) / (1000 * 60));
    console.log(`[IndexedDB] ✅ Valid cache hit for userId: ${userId} (age: ${ageInMinutes} minutes)`);
  }
  
  return { data, timestamp };
};
