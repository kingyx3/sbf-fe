// src/components/LoadingSpinner.js
import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900">
      {/* Spinner */}
      <div
        className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"
      ></div>
      {/* Loading Text */}
      <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
        Loading...
      </p>
    </div>
  );
};

export default LoadingSpinner;