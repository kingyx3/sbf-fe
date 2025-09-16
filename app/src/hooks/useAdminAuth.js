import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { envVars } from "../config/envConfig";

/**
 * Custom hook for managing admin authentication state
 * Checks if the current user has admin privileges using custom claims
 * @returns {Object} { user, loading, isAdmin, adminLoading }
 */
export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // In test mode, all users are admin
      if (envVars.testMode) {
        setIsAdmin(true);
        setAdminLoading(false);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        // Check custom claims for admin status
        const idTokenResult = await user.getIdTokenResult();
        const hasAdminClaims = idTokenResult.claims.admin === true;
        setIsAdmin(hasAdminClaims);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  return { user, loading, isAdmin, adminLoading };
};