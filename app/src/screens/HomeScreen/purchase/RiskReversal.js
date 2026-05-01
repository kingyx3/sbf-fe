import React from "react";

const items = [
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    text: "Price of a few coffees = Better decisions",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "Saves 10+ hours of research",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    text: "Secure payment",
  },
];

const RiskReversal = () => (
  <div className="flex items-center justify-center gap-4 flex-wrap">
    {items.map(({ icon, text }, i) => (
      <div key={i} className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{text}</span>
      </div>
    ))}
  </div>
);

export default RiskReversal;
