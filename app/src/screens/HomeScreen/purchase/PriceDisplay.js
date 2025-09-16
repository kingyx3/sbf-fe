// purchase/PriceDisplay.js
import React from "react";

const PriceDisplay = ({ price, originalPrice, size = 'base', highlight = false }) => {
  const savings = originalPrice - price;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);

  const sizeClasses = {
    sm: 'text-base',
    base: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl'
  };

  return (
    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
      <span className={`${sizeClasses[size]} font-bold ${
        highlight ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
      }`}>
        SGD{price.toFixed(2)}
      </span>
      {originalPrice > price && (
        <>
          <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
            SGD{originalPrice.toFixed(2)}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            highlight
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {savingsPercentage}% OFF
          </span>
        </>
      )}
    </div>
  );
};

export default PriceDisplay;