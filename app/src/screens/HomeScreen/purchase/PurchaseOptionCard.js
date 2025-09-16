// purchase/PurchaseOptionCard.js
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
  badge
}) => {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? highlight
            ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/10 shadow-md'
            : 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : highlight
            ? 'border-2 border-purple-300 dark:border-purple-700 hover:border-purple-400'
            : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300'
      } ${highlight ? 'relative' : ''}`}
      onClick={onClick}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl rounded-tr">
          POPULAR
        </div>
      )}

      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {description}
            </p>
          </div>
        </div>

        <PriceDisplay
          price={price}
          originalPrice={originalPrice}
          highlight={highlight}
        />

        <FeatureList
          items={features}
          highlight={highlight}
        />
      </div>
    </div>
  );
};

export default PurchaseOptionCard;