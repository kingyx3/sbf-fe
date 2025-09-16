import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { envVars } from "./envConfig";

const firebaseConfig = {
  apiKey: envVars.REACT_APP_FB_apiKey,
  authDomain:  envVars.REACT_APP_FB_authDomain,
  databaseURL: envVars.REACT_APP_FB_databaseURL,
  projectId: envVars.REACT_APP_FB_projectId,
  storageBucket: envVars.REACT_APP_FB_storageBucket,
  messagingSenderId: envVars.REACT_APP_FB_messagingSenderId,
  appId: envVars.REACT_APP_FB_appId,
  measurementId: envVars.REACT_APP_FB_measurementId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Proactive check for IndexedDB availability
const isIndexedDBAvailable = async () => {
  try {
    if (!window.indexedDB || !indexedDB.databases) return false;
    await indexedDB.databases(); // throws if not available
    return true;
  } catch {
    return false;
  }
};

(async () => {
  if (!envVars.testMode) {
    const useIndexedDB = await isIndexedDBAvailable();
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(envVars.REACT_APP_FB_recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
        storage: useIndexedDB ? "indexedDB" : "sessionStorage",
      });

      if (!useIndexedDB) {
        console.warn("[AppCheck] Falling back to sessionStorage early — IndexedDB unavailable.");
      }
    } catch (err) {
      console.error("[AppCheck] Failed to initialize App Check", err);
    }
  }
})();

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const functions = getFunctions(app, "asia-southeast1");
const storage = getStorage(app);

// Export Firebase Services
export { auth, db, realtimeDb, functions, storage };
