import React from "react";

const VARIANTS = {
  warning: {
    container: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60",
    icon: "text-amber-500 dark:text-amber-400",
    title: "text-amber-800 dark:text-amber-300",
    body: "text-amber-700 dark:text-amber-400",
    label: "Warning",
  },
  error: {
    container: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/60",
    icon: "text-orange-500 dark:text-orange-400",
    title: "text-orange-800 dark:text-orange-300",
    body: "text-orange-700 dark:text-orange-400",
    label: "Notice",
  },
  info: {
    container: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60",
    icon: "text-blue-500 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-300",
    body: "text-blue-700 dark:text-blue-400",
    label: "Info",
  },
};

const WarningIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const WarningBanner = ({ message, isDarkMode, onRetry }) => {
  const defaultMessage = "The data (& estimates) shown might not be fully accurate or up to date. Please verify all information directly with the relevant government agencies.";
  const displayMessage = message || defaultMessage;

  const isError = message && (message.includes("unavailable") || message.includes("error") || message.includes("failed"));
  const isInfo = message && !isError;
  const variant = isInfo ? "info" : isError ? "error" : "warning";
  const v = VARIANTS[variant];
  const Icon = isInfo ? InfoIcon : WarningIcon;

  return (
    <div className={`${v.container} rounded-xl px-4 py-3 mb-5 flex items-start gap-3`}>
      <Icon className={`${v.icon} w-4 h-4 mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${v.title} mb-0.5`}>{v.label}</p>
        <p className={`text-xs ${v.body} leading-relaxed`}>{displayMessage}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default WarningBanner;
