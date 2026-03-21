import Dexie from "dexie";
import { envVars } from "../config/envConfig";

export const db = new Dexie("CacheDB");

db.version(1).stores({
  csvCache: "&userId", // Only one entry per user
});

// Version 2: drop the old csvCache table so the primary key can be changed.
// IndexedDB does not support changing an existing store's primary key in-place,
// so we must drop the table here and recreate it in version 3.
db.version(2).stores({
  csvCache: null,
});

// Version 3: recreate csvCache with a compound primary key to cache per (userId, sbfCode)
db.version(3).stores({
  csvCache: "&[userId+sbfCode]",
});

export const saveCSVToIndexedDB = async (userId, data, paymentDocCount, sbfCode) => {
  return db.csvCache.put({
    userId,
    sbfCode,
    data,
    timestamp: Date.now(),
    paymentDocCount,
  });
};

export const getCSVFromIndexedDB = async (userId, paymentDocCount, TTL, sbfCode) => {
  const cached = await db.csvCache.get([userId, sbfCode]);
  if (!cached) {
    console.log(`[IndexedDB] ❌ No cache found for userId: ${userId}, sbfCode: ${sbfCode}`);
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
    if (envVars.REACT_APP_DEBUG) console.log(`[IndexedDB] ⏰ Cache expired for userId: ${userId}, sbfCode: ${sbfCode}`);
    return null;
  }

  if (envVars.REACT_APP_DEBUG) {
    const ageInMinutes = Math.round((now - timestamp) / (1000 * 60));
    console.log(`[IndexedDB] ✅ Valid cache hit for userId: ${userId}, sbfCode: ${sbfCode} (age: ${ageInMinutes} minutes)`);
  }
  
  return { data, timestamp };
};
