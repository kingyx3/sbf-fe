import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { envVars } from "../config/envConfig";

/**
 * Fetch whitelisted emails from Firestore system collection
 * @returns {Promise<string[]>} Array of whitelisted email addresses
 */
export const getWhitelistedEmails = async () => {
  try {
    // Only enforce whitelist in dev environment
    if (envVars.REACT_APP_TYPE === "PROD") {
      return null; // Production has no whitelist restrictions
    }

    const systemDocRef = doc(db, "system", "users");
    const systemDoc = await getDoc(systemDocRef);
    
    if (systemDoc.exists()) {
      const data = systemDoc.data();
      return data.emails || [];
    } else {
      console.warn("System users document not found in Firestore");
      return [];
    }
  } catch (error) {
    console.error("Error fetching whitelisted emails:", error);
    return [];
  }
};

/**
 * Check if a user email is whitelisted for dev environment access
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} True if user is whitelisted or in production
 */
export const isEmailWhitelisted = async (email) => {
  try {
    // Always allow access in production
    if (envVars.REACT_APP_TYPE === "PROD") {
      return true;
    }

    // For dev environment, check whitelist
    const whitelistedEmails = await getWhitelistedEmails();
    
    if (!whitelistedEmails || whitelistedEmails.length === 0) {
      console.warn("No whitelisted emails found, denying access");
      return false;
    }

    return whitelistedEmails.includes(email);
  } catch (error) {
    console.error("Error checking email whitelist:", error);
    return false; // Deny access on error for security
  }
};