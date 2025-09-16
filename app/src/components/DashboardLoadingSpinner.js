import React from "react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const DashboardLoadingSpinner = ({ 
  isUsingCachedData = false, 
  loadingMessage = "Loading dashboard data...",
  showNetworkStatus = true 
}) => {
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  const getLoadingMessage = () => {
    if (isUsingCachedData) {
      return "Loading fresh data...";
    }
    
    if (!isOnline) {
      return "Waiting for internet connection...";
    }
    
    if (isSlowConnection) {
      return "Loading data... (slow connection detected)";
    }
    
    return loadingMessage;
  };

  const getStatusIndicator = () => {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-red-600 dark:text-red-400">
            No internet connection
          </span>
        </div>
      );
    }

    if (isSlowConnection) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            Slow connection ({connectionType})
          </span>
        </div>
      );
    }

    if (isUsingCachedData) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Showing cached data, refreshing...
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs text-green-600 dark:text-green-400">
          Connected
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900">
      {/* Spinner */}
      <div
        className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"
      ></div>
      
      {/* Loading Text */}
      <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
        {getLoadingMessage()}
      </p>

      {/* Network Status Indicator */}
      {showNetworkStatus && getStatusIndicator()}

      {/* Helpful message for slow connections */}
      {(isSlowConnection || !isOnline) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {!isOnline 
            ? "The dashboard will load automatically when your connection is restored."
            : "This may take a bit longer due to your connection speed."
          }
        </p>
      )}
    </div>
  );
};

export default DashboardLoadingSpinner;