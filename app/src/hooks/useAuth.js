import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { checkAndSetBackdoorAdmin } from "../utils/adminClaimsUtils";
import { isEmailWhitelisted } from "../utils/whitelistUtils";
import { envVars } from "../config/envConfig";

/**
 * Custom hook for managing authentication state
 * @returns {Object} { user, loading, isWhitelisted }
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(true); // Default to true for production

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Check if this is the backdoor user and set admin claims if needed
        await checkAndSetBackdoorAdmin(authUser);
        
        // Check whitelist for dev environment
        if (envVars.REACT_APP_TYPE === "DEV") {
          const whitelisted = await isEmailWhitelisted(authUser.email);
          setIsWhitelisted(whitelisted);
          
          if (!whitelisted) {
            console.warn(`User ${authUser.email} is not whitelisted for dev environment access`);
            // Sign out non-whitelisted users in dev environment
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }
        }
      }
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isWhitelisted };
};