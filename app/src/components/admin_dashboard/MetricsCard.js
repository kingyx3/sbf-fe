import React from "react";

const MetricsCard = ({ icon, title, value, isDarkMode }) => {
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="text-2xl">{icon}</div>
        </div>
        <div className="ml-4">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            {title}
          </h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;