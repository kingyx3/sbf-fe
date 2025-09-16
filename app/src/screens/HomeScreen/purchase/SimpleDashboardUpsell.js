// purchase/SimpleDashboardUpsell.js
import React, { useEffect } from "react";
import { envVars } from "../../../config/envConfig";

const SimpleDashboardUpsell = ({
  availableDashboards = [],
  selectedPurchase = [],
  setSelectedPurchase,
  handleCheckout,
  paymentLoading,
}) => {
  const singlePrice = Number(envVars.singleDashboardPrice) || 9.99;

  // Auto-select first available dashboard if none selected
  useEffect(() => {
    if (availableDashboards.length > 0 && selectedPurchase.length === 0) {
      setSelectedPurchase([availableDashboards[0]]);
    }
  }, [availableDashboards, selectedPurchase, setSelectedPurchase]);

  const handleSelectChange = (e) => {
    const selectedName = e.target.value;
    const selectedDashboard = availableDashboards.find(d => d.name === selectedName);
    if (selectedDashboard) {
      setSelectedPurchase([selectedDashboard]);
    }
  };

  // ACTUALLY USE the truncate function for displayed text
  const displayName = (name) => {
    const maxLength = 20;
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  return (
    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">Need another dashboard?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Unlock additional SBF data
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto min-w-0">
          <div className="relative flex-1 sm:flex-none sm:w-48 min-w-0">
            <select
              className="px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 w-full truncate pr-6"
              value={selectedPurchase[0]?.name || ''}
              onChange={handleSelectChange}
              title={selectedPurchase[0]?.name || ''} // Show full name on hover
            >
              {availableDashboards.map((dashboard) => (
                <option key={dashboard.name} value={dashboard.name}>
                  {displayName(dashboard.name)}{dashboard.preOrder ? " (Pre-order)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheckout}
            disabled={selectedPurchase.length === 0 || paymentLoading}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${
              selectedPurchase.length === 0 || paymentLoading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {paymentLoading ? 'Processing...' : `Add (SGD${singlePrice.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboardUpsell;