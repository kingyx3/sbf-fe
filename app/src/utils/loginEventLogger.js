import { ref, push, serverTimestamp } from "firebase/database";
import { realtimeDb } from "../config/firebaseConfig";

/**
 * Login Event Logger - Logs user login events to Firebase Realtime Database
 */

/**
 * Get IP address from frontend using a simple IP detection service
 */
const getIpAddress = async () => {
  try {
    // Use ipify.org for simple IP address detection
    const response = await fetch('https://api.ipify.org?format=text', {
      method: 'GET',
      // Set a reasonable timeout
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const ip = await response.text();
      if (ip && ip.trim()) {
        return ip.trim();
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.error('[LoginLogger] Failed to get IP address:', error);
    return 'unknown';
  }
};

/**
 * Log a login event to Firebase Realtime Database
 * @param {Object} eventData - Event data to log
 * @param {string} eventData.userId - User ID (if available)
 * @param {string} eventData.email - User email (if available)
 * @param {string} eventData.method - Login method ('email_link' | 'google_oauth')
 * @param {string} eventData.status - Login status ('success' | 'failure' | 'attempt')
 * @param {string} [eventData.error] - Error message (if applicable)
 */
export const logLoginEvent = async (eventData) => {
  try {
    const loginEventsRef = ref(realtimeDb, 'loginEvents');
    
    // Get IP address only
    const ipAddress = await getIpAddress();
    
    const logEntry = {
      ...eventData,
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ipAddress: ipAddress,
    };

    await push(loginEventsRef, logEntry);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[LoginLogger] Event logged:', logEntry);
    }
  } catch (error) {
    // Don't throw errors to avoid breaking login flow
    console.error('[LoginLogger] Failed to log event:', error);
  }
};

/**
 * Log successful login
 */
export const logLoginSuccess = (userId, email, method) => {
  return logLoginEvent({
    userId,
    email,
    method,
    status: 'success'
  });
};

/**
 * Log failed login
 */
export const logLoginFailure = (email, method, error) => {
  return logLoginEvent({
    email,
    method,
    status: 'failure',
    error: error?.message || error
  });
};

/**
 * Log login attempt
 */
export const logLoginAttempt = (email, method) => {
  return logLoginEvent({
    email,
    method,
    status: 'attempt'
  });
};