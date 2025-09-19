import React, { useState } from "react";

const TruncatedPaymentId = ({ id, maxLength = 12 }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncatedId = id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;
  
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{truncatedId}</span>
      <button
        onClick={handleCopy}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          copied 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title={copied ? 'Copied!' : 'Click to copy full ID'}
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
};

export default TruncatedPaymentId;