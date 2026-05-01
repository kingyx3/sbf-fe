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
    <div className="w-full px-4 py-8 sm:py-12 animate-fade-in">
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Unlock Premium Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            SBF Dashboard Access
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            Choose the plan that fits your needs and get instant access to Singapore's most comprehensive SBF analytics.
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
        <div className="mb-4">
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

        {/* Stripe trust badge */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          Payments secured by Stripe
        </div>
      </div>
    </div>
  );
};

export default PurchaseDashboardBlock;
