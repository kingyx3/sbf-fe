import React from "react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const ConnectionStatusBar = ({ 
  isRefetching = false, 
  isUsingCachedData = false,
  isDarkMode = false 
}) => {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();

  // Don't show anything if everything is normal and not refreshing
  if (isOnline && !isSlowConnection && !isRefetching && !isUsingCachedData) {
    return null;
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return "Offline - Showing cached data";
    }
    
    if (isRefetching) {
      return isSlowConnection 
        ? "Refreshing data (slow connection)..."
        : "Refreshing data...";
    }
    
    if (isUsingCachedData) {
      return "Showing cached data while updating...";
    }
    
    if (isSlowConnection) {
      return `Slow connection detected (${connectionType})`;
    }
    
    return "Connected";
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-300";
    if (isSlowConnection) return "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-300";
    if (isRefetching || isUsingCachedData) return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300";
    return "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-300";
  };

  const getIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    }
    
    if (isRefetching) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    if (isSlowConnection) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 border-b transition-all duration-300 ${getStatusColor()}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium">
          {getStatusMessage()}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatusBar;