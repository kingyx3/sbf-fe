// purchase/SimpleDashboardUpsell.js
import React, { useEffect } from "react";
import { envVars } from "../../../config/envConfig";
import { truncate } from "../../../components/helpers";

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

  return (
    <div className="mt-5 px-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Unlock another dashboard
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add access to any past or upcoming SBF launch
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto min-w-0">
            <select
              className="flex-1 sm:w-44 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={selectedPurchase[0]?.name || ''}
              onChange={handleSelectChange}
              title={selectedPurchase[0]?.name || ''}
            >
              {availableDashboards.map((dashboard) => (
                <option key={dashboard.name} value={dashboard.name}>
                  {truncate(dashboard.name, 20)}{dashboard.preOrder ? " (Pre-order)" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={handleCheckout}
              disabled={selectedPurchase.length === 0 || paymentLoading}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedPurchase.length === 0 || paymentLoading
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {paymentLoading ? 'Processing…' : `Add · SGD ${singlePrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboardUpsell;