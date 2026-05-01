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
  disabled,
}) => {
  const getButtonText = () => {
    if (isUnlimitedSelected) return `Get Lifetime Access · Save SGD${unlimitedSavings.toFixed(2)}`;
    if (isBundleSelected) return `Buy Bundle · Save SGD${bundleSavings.toFixed(2)}`;
    return `Buy ${singleOption[0]} · Save SGD${singleSavings.toFixed(2)}`;
  };

  const gradientClass = isUnlimitedSelected
    ? "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
    : "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
        disabled
          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          : `bg-gradient-to-r ${gradientClass} text-white shadow-md hover:shadow-lg active:scale-[0.98]`
      }`}
    >
      {paymentLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
