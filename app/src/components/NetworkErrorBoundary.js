import React from "react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const NetworkErrorBoundary = ({ error, retry, isRetrying = false, children }) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (!error) {
    return children;
  }

  const getErrorMessage = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NetworkErrorBoundary] Processing error:', error);
    }
    
    if (!isOnline) {
      return "You're currently offline. Please check your internet connection.";
    }

    if (error.code === 'permission-denied') {
      return "Access denied. Please check your subscription or login status.";
    }

    if (error.code === 'unauthenticated') {
      return "Authentication required. Please log in again.";
    }

    if (error.code === 'timeout' || error.isTimeout) {
      return "Loading is taking longer than expected. This could be due to network issues or high server load.";
    }

    if (error.code === 'functions/internal') {
      return "Service temporarily unavailable. Our team has been notified. Please try again in a few minutes.";
    }

    if (error.code === 'functions/unavailable') {
      return "Dashboard service is temporarily unavailable. Please try again in a moment.";
    }

    if (error.code === 'functions/timeout' || error.code === 'functions/deadline-exceeded') {
      return "Request timed out. Please check your connection and try again.";
    }

    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      return isSlowConnection
        ? "Network request timed out due to slow connection. Please try again."
        : "Network error occurred. Please check your connection and try again.";
    }

    if (error.message?.includes('Invalid data returned from server')) {
      return "Data format error. Please refresh the page or contact support if this persists.";
    }

    console.error('[NetworkErrorBoundary] Unhandled error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    return error.message || "An unexpected error occurred while loading data. Please refresh the page or contact support.";
  };

  const getHelpfulTips = () => {
    if (!isOnline) {
      return "The dashboard will automatically reload when your connection is restored.";
    }

    if (error?.code === 'timeout' || error?.isTimeout) {
      return "Try refreshing the page, check your internet connection, or wait a moment before trying again.";
    }

    if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
      return "Please log out and log back in, or contact support if your subscription has expired.";
    }

    if (error?.code?.startsWith('functions/')) {
      return "Our servers are experiencing issues. Please try again in a few minutes or contact support.";
    }

    if (isSlowConnection) {
      return "You're on a slow connection. Consider switching to a faster network if possible.";
    }

    return "Try refreshing the page first. If the problem persists, please contact support with the error details above.";
  };

  const iconBg = !isOnline ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30';
  const iconColor = !isOnline ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400';

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-card p-8 text-center">
        <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4 ${iconBg}`}>
          <svg className={`h-5 w-5 ${iconColor}`}
            fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {!isOnline ? "Connection Lost" : "Loading Error"}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {getErrorMessage()}
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {getHelpfulTips()}
        </p>

        <div className="flex items-center justify-center gap-1.5 mb-5">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {retry && isOnline && (
          <button
            onClick={retry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        )}

        {!isOnline && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            Will automatically retry when connection is restored
          </p>
        )}
      </div>
    </div>
  );
};

export default NetworkErrorBoundary;