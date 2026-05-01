import React from "react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const DashboardLoadingSpinner = ({
  isUsingCachedData = false,
  loadingMessage = "Loading dashboard data...",
  showNetworkStatus = true,
}) => {
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  const getLoadingMessage = () => {
    if (isUsingCachedData) return "Loading fresh data...";
    if (!isOnline) return "Waiting for internet connection...";
    if (isSlowConnection) return "Loading data... (slow connection detected)";
    return loadingMessage;
  };

  const statusConfig = () => {
    if (!isOnline) return { color: "bg-red-500", text: "text-red-500 dark:text-red-400", label: "No internet connection" };
    if (isSlowConnection) return { color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: `Slow connection (${connectionType})` };
    if (isUsingCachedData) return { color: "bg-blue-500 animate-pulse", text: "text-blue-600 dark:text-blue-400", label: "Showing cached data, refreshing..." };
    return { color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Connected" };
  };

  const status = statusConfig();

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          <div className="absolute inset-2 w-10 h-10 rounded-full border-3 border-transparent border-t-blue-300/50 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{getLoadingMessage()}</p>

          {showNetworkStatus && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
              <span className={`text-xs ${status.text}`}>{status.label}</span>
            </div>
          )}

          {(isSlowConnection || !isOnline) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs text-center mt-2">
              {!isOnline
                ? "The dashboard will load automatically when your connection is restored."
                : "This may take a bit longer due to your connection speed."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLoadingSpinner;
