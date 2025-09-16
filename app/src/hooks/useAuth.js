import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { checkAndSetBackdoorAdmin } from "../utils/adminClaimsUtils";

/**
 * Custom hook for managing authentication state
 * @returns {Object} { user, loading }
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Check if this is the backdoor user and set admin claims if needed
        await checkAndSetBackdoorAdmin(authUser);
      }
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};