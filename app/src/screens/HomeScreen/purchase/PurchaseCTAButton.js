// purchase/PurchaseCTAButton.js
import React from "react";

const PurchaseCTAButton = ({
  isBundleSelected,
  isUnlimitedSelected,
  bundleSavings,
  unlimitedSavings,
  singleOption,
  singleSavings,
  paymentLoading,
  onClick,
  disabled
}) => {
  const getButtonText = () => {
    if (isUnlimitedSelected) {
      return `Get Lifetime Access (Save SGD${unlimitedSavings.toFixed(2)})`;
    }
    if (isBundleSelected) {
      return `Buy Bundle (Save SGD${bundleSavings.toFixed(2)})`;
    }
    return `Buy ${singleOption[0]} (Save SGD${singleSavings.toFixed(2)})`;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-lg font-bold text-white transition-all text-sm sm:text-base ${
        disabled
          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          : isUnlimitedSelected
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {paymentLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        getButtonText()
      )}
    </button>
  );
};

export default PurchaseCTAButton;