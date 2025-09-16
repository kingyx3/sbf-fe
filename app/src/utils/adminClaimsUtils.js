import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebaseConfig";

/**
 * Set admin custom claims for a user
 * @param {string} uid - User ID
 * @param {string} email - User email (alternative to uid)
 * @param {boolean} isAdmin - Whether user should be admin
 * @param {string} idToken - Current user's ID token for authentication
 */
export const setAdminClaims = async (uid, email, isAdmin, idToken) => {
  try {
    // Use callable function instead of direct HTTP request
    const setAdminClaimsFunction = httpsCallable(functions, "setAdminClaims");
    
    const result = await setAdminClaimsFunction({
      uid,
      email,
      isAdmin,
      authToken: idToken, // Pass token in data instead of headers for callable functions
    });
    
    return result.data;
  } catch (error) {
    console.error("Error setting admin claims:", error);
    throw error;
  }
};

/**
 * Initialize backdoor admin for the specific email
 * This can be called without authentication
 * @param {string} email - Email address (must be kingyx33@gmail.com)
 */
export const initializeBackdoorAdmin = async (email) => {
  try {
    const initializeBackdoorAdminFunction = httpsCallable(functions, "initializeBackdoorAdmin");
    
    const result = await initializeBackdoorAdminFunction({
      email,
    });
    
    return result.data;
  } catch (error) {
    console.error("Error initializing backdoor admin:", error);
    throw error;
  }
};

/**
 * Check if current user is the backdoor user and automatically set admin claims
 * @param {Object} user - Firebase user object
 */
export const checkAndSetBackdoorAdmin = async (user) => {
  if (!user || user.email !== "kingyx33@gmail.com") {
    return false;
  }

  try {
    // Check if user already has admin claims
    const idTokenResult = await user.getIdTokenResult();
    if (idTokenResult.claims.admin === true) {
      console.log("Backdoor user already has admin claims");
      return true;
    }

    // Initialize backdoor admin
    console.log("Setting up backdoor admin for", user.email);
    await initializeBackdoorAdmin(user.email);
    
    // Force token refresh to get new claims
    await user.getIdToken(true);
    
    console.log("Backdoor admin setup completed");
    return true;
  } catch (error) {
    console.error("Error setting up backdoor admin:", error);
    return false;
  }
};

/**
 * List all users
 * @param {Object} user - Current authenticated user (must be admin)
 */
export const listAllUsers = async (user) => {
  try {
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check if current user is admin
    const idTokenResult = await user.getIdTokenResult();
    if (!idTokenResult.claims.admin) {
      throw new Error("Admin access required");
    }

    const listAllUsersFunction = httpsCallable(functions, "listAllUsers");
    
    const result = await listAllUsersFunction({});
    
    return result.data;
  } catch (error) {
    console.error("Error listing all users:", error);
    throw error;
  }
};