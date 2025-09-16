import { useState, useEffect } from 'react';

/**
 * Custom hook to detect network connectivity status
 * Returns both online status and connection quality indicators
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const updateConnectionInfo = () => {
      // Get connection info if available (Chrome/Edge)
      if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection;
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if supported
    if ('connection' in navigator && navigator.connection) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    // Initial connection info update
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator && navigator.connection) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g'
  };
};

export default useNetworkStatus;