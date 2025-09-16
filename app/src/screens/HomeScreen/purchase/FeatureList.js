// purchase/FeatureList.js
import React from "react";

const FeatureList = ({ items, highlight = false }) => {
  return (
    <ul className="text-xs sm:text-sm space-y-1.5 mt-2">
      {items.slice(0, 3).map((item, index) => (
        <li key={index} className="flex items-start">
          <svg
            className={`flex-shrink-0 w-3.5 h-3.5 mt-0.5 mr-1.5 ${
              highlight ? 'text-purple-500' : 'text-blue-500'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className={highlight ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default FeatureList;