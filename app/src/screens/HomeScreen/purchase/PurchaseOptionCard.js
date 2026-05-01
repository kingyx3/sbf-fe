import React from "react";
import PriceDisplay from "./PriceDisplay";
import FeatureList from "./FeatureList";

const PurchaseOptionCard = ({
  title,
  description,
  price,
  originalPrice,
  features,
  isSelected,
  onClick,
  highlight = false,
  badge,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 p-4 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isSelected
          ? highlight
            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/15 shadow-md focus-visible:ring-purple-500"
            : "border-blue-500 bg-blue-50 dark:bg-blue-900/15 shadow-md focus-visible:ring-blue-500"
          : highlight
          ? "border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-gray-800 hover:shadow-card focus-visible:ring-purple-400"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-card focus-visible:ring-gray-400"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div
          className={`absolute -top-px right-4 px-2.5 py-0.5 rounded-b-md text-[10px] font-bold tracking-wide ${
            highlight
              ? "bg-purple-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {badge}
        </div>
      )}

      {/* Selection indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        <div
          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
            isSelected
              ? highlight
                ? "border-purple-500 bg-purple-500"
                : "border-blue-500 bg-blue-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          {isSelected && (
            <svg viewBox="0 0 16 16" fill="none" className="w-full h-full p-0.5">
              <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{description}</p>

      <PriceDisplay price={price} originalPrice={originalPrice} highlight={highlight} />

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <FeatureList items={features} highlight={highlight} />
      </div>
    </div>
  );
};

export default PurchaseOptionCard;
