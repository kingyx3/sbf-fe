// WarningBanner.js
import React from "react";

const WarningBanner = ({ message, isDarkMode, onRetry }) => {
  // If no custom message provided, show the default warning
  const defaultMessage = "The data (& estimates) shown might not be fully accurate or up to date. Please verify all information directly with the relevant government agencies.";
  const displayMessage = message || defaultMessage;
  
  // Determine if this is an error/warning or just informational
  const isDefaultWarning = !message;
  const isError = message && (message.includes("unavailable") || message.includes("error") || message.includes("failed"));
  const isInfo = message && !isError;
  
  // Determine colors and icon based on message type
  const bgColor = isDefaultWarning 
    ? "bg-yellow-100 dark:bg-yellow-900" 
    : isError
    ? "bg-orange-100 dark:bg-orange-900"
    : "bg-blue-100 dark:bg-blue-900";
  const borderColor = isDefaultWarning 
    ? "border-yellow-500 dark:border-yellow-600" 
    : isError
    ? "border-orange-500 dark:border-orange-600"
    : "border-blue-500 dark:border-blue-600";
  const textColor = isDefaultWarning 
    ? "text-yellow-700 dark:text-yellow-200" 
    : isError
    ? "text-orange-700 dark:text-orange-200"
    : "text-blue-700 dark:text-blue-200";
  
  // Dynamic label and icon
  const label = isError ? "🚩Warning:" : isInfo ? "ℹ️ Notice:" : "🚩Warning:";
  
  return (
    <div className={`${bgColor} border-l-4 ${borderColor} ${textColor} p-4 mb-6 rounded-md shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold">{label}</p>
          <p>{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default WarningBanner;