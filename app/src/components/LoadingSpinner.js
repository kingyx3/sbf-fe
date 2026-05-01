import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
