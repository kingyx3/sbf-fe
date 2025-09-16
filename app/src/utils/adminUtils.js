import { setAdminClaims } from "./adminClaimsUtils";

/**
 * Utility function to create an admin user using custom claims
 * This can be used to bootstrap the first admin user
 * @param {string} userId - The Firebase Auth user ID
 * @param {string} email - The user's email
 * @param {Object} currentUser - Current authenticated user (for authorization)
 */
export const createAdminUser = async (userId, email, currentUser) => {
  try {
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // Use custom claims function
    const idToken = await currentUser.getIdToken();
    await setAdminClaims(userId, email, true, idToken);

    console.log(`Admin user created successfully for ${email}`);
    return true;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
};

/**
 * Utility function to check if a user is admin using custom claims
 * @param {Object} user - Firebase Auth user object
 */
export const checkAdminStatus = async (user) => {
  try {
    if (!user) {
      return false;
    }

    // Check custom claims only
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Development helper - adds admin status to current user using custom claims
 * Only use this in development to bootstrap the first admin
 */
export const makeCurrentUserAdmin = async (user) => {
  if (!user) {
    console.error("No user provided");
    return false;
  }

  try {
    // For the backdoor user, use the special initialization function
    if (user.email === "kingyx33@gmail.com") {
      const { checkAndSetBackdoorAdmin } = await import("./adminClaimsUtils");
      return await checkAndSetBackdoorAdmin(user);
    }

    // For other users, they need admin privileges to promote themselves
    const isCurrentlyAdmin = await checkAdminStatus(user);
    if (!isCurrentlyAdmin) {
      throw new Error("Only admin users can promote others to admin");
    }

    const idToken = await user.getIdToken();
    await setAdminClaims(user.uid, user.email, true, idToken);
    
    console.log("Current user promoted to admin");
    return true;
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return false;
  }
};