// WarningBanner.js
import React from "react";

const WarningBanner = () => {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm">
      <p className="font-semibold">🚩Warning:</p>
      <p>
        The data (& estimates) shown might not be fully accurate or up to date. Please verify all information directly with the relevant government agencies.
      </p>
    </div>
  );
};

export default WarningBanner;