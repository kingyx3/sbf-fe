import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentFailureScreen = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/home");
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card-lg p-8 text-center animate-fade-in">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Payment Failed
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Something went wrong processing your payment. No charge has been made. Please try again.
        </p>

        <div className="mb-6 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Redirecting in {countdown}s
          </span>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm transition-colors"
        >
          Back to Home
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PaymentFailureScreen;
