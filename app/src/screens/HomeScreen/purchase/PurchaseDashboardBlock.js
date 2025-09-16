import React from "react";
import { envVars } from "../../../config/envConfig";
import PurchaseOptionCard from "./PurchaseOptionCard";
import PurchaseCTAButton from "./PurchaseCTAButton";
import RiskReversal from "./RiskReversal";

const PurchaseDashboardBlock = ({
  availableDashboards,
  selectedPurchase,
  setSelectedPurchase,
  handleCheckout,
  paymentLoading,
}) => {
  // Get options from environment variables
  const singleOption = envVars.singleDashboardOption; // e.g. ["Feb2025"]
  const bundleOption = envVars.bundleDashboardOption; // e.g. ["Feb2025", "Jul2025"]
  const unlimitedOption = envVars.unlimitedDashboardOption; // e.g. ["Unlimited"]

  // Prices from env vars (converted to numbers)
  const bundlePrice = Number(envVars.bundleDashboardPrice);
  const singlePrice = Number(envVars.singleDashboardPrice);
  const unlimitedPrice = Number(envVars.unlimitedDashboardPrice);
  const originalPrice = Number(envVars.originalPrice);

  // Calculate savings values
  const bundleOriginalTotal = originalPrice * 2 - 0.10;
  const bundleSavings = bundleOriginalTotal - bundlePrice;
  const singleSavings = originalPrice - singlePrice;
  const unlimitedOriginalTotal = originalPrice * 5 - 0.10;
  const unlimitedSavings = unlimitedOriginalTotal - unlimitedPrice;

  const resolveDashboards = (names) => {
    if (names.length === 1 && names[0] === "Unlimited") {
      return [{ name: "Unlimited", preOrder: false }];
    }
    return availableDashboards.filter((d) => names.includes(d.name));
  };

  // Lookup dashboard details
  const singleDashboard = availableDashboards.find(d => d.name === singleOption[0]);
  const singleDescription = singleDashboard
    ? `${singleDashboard.name}${singleDashboard.preOrder ? " (Pre-order)" : ""}`
    : singleOption[0];

  const bundleDescriptions = bundleOption.map(name => {
    const dash = availableDashboards.find(d => d.name === name);
    return dash ? `${dash.name}${dash.preOrder ? " (Pre-order)" : ""}` : name;
  });
  const bundleDescription = bundleDescriptions.join(" + ");

  // Determine selected option
  const isBundleSelected =
    selectedPurchase.length === bundleOption.length &&
    selectedPurchase.every(val => bundleOption.includes(val.name));
  const isUnlimitedSelected =
    selectedPurchase.length === 1 &&
    selectedPurchase[0]?.name === unlimitedOption[0];

  // Feature lists
  const singleFeatures = [
    "Immediate access",
    "All premium features",
    "One-time payment"
  ];

  const bundleFeatures = [
    "Both dashboards at discount",
    `Early access to ${bundleOption[1]}`,
    "Best for comparing trends"
  ];

  const unlimitedFeatures = [
    "All current + future dashboards",
    "Lifetime access",
    "Best value for power users"
  ];

  return (
    <div className="w-full px-4 py-6 sm:py-8">
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            SBF Dashboard Access
          </h2>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            Choose your preferred option below
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <PurchaseOptionCard
            title="Single"
            description={singleDescription}
            price={singlePrice}
            originalPrice={originalPrice}
            features={singleFeatures}
            isSelected={
              selectedPurchase.length === 1 &&
              selectedPurchase[0]?.name === singleOption[0]
            }
            onClick={() => setSelectedPurchase(resolveDashboards(singleOption))}
          />

          <PurchaseOptionCard
            title="Bundle"
            description={bundleDescription}
            price={bundlePrice}
            originalPrice={bundleOriginalTotal}
            features={bundleFeatures}
            isSelected={isBundleSelected}
            onClick={() => setSelectedPurchase(resolveDashboards(bundleOption))}
            badge="SAVE MORE"
          />

          <PurchaseOptionCard
            title="Unlimited"
            description="Lifetime Access"
            price={unlimitedPrice}
            originalPrice={unlimitedOriginalTotal}
            features={unlimitedFeatures}
            isSelected={isUnlimitedSelected}
            onClick={() => setSelectedPurchase(resolveDashboards(unlimitedOption))}
            badge="BEST VALUE"
            highlight={true}
          />
        </div>

        {/* CTA Button */}
        <div className="mb-3">
          <PurchaseCTAButton
            isBundleSelected={isBundleSelected}
            isUnlimitedSelected={isUnlimitedSelected}
            bundleSavings={bundleSavings}
            unlimitedSavings={unlimitedSavings}
            singleOption={singleOption}
            singleSavings={singleSavings}
            paymentLoading={paymentLoading}
            onClick={handleCheckout}
            disabled={!selectedPurchase.length || paymentLoading}
          />
        </div>

        <RiskReversal />
      </div>
    </div>
  );
};

export default PurchaseDashboardBlock;
