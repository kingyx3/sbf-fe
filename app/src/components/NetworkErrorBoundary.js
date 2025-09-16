import React from "react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const NetworkErrorBoundary = ({ error, retry, isRetrying = false, children }) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (!error) {
    return children;
  }

  const getErrorMessage = () => {
    if (!isOnline) {
      return "You're currently offline. Please check your internet connection.";
    }

    if (error.code === 'permission-denied') {
      return "Access denied. Please check your subscription or login status.";
    }

    if (error.code === 'unauthenticated') {
      return "Authentication required. Please log in again.";
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return isSlowConnection 
        ? "Network request timed out due to slow connection. Please try again."
        : "Network error occurred. Please check your connection and try again.";
    }

    return error.message || "An unexpected error occurred while loading data.";
  };

  const getHelpfulTips = () => {
    if (!isOnline) {
      return "The dashboard will automatically reload when your connection is restored.";
    }

    if (isSlowConnection) {
      return "You're on a slow connection. Consider switching to a faster network if possible.";
    }

    return "If the problem persists, please refresh the page or contact support.";
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {!isOnline ? "Connection Lost" : "Loading Error"}
        </h3>

        {/* Error Message */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {getErrorMessage()}
        </p>

        {/* Helpful Tips */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          {getHelpfulTips()}
        </p>

        {/* Network Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Retry Button */}
        {retry && isOnline && (
          <button
            onClick={retry}
            disabled={isRetrying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        )}

        {/* Auto-retry message when offline */}
        {!isOnline && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Will automatically retry when connection is restored
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkErrorBoundary;