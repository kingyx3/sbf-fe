import React from "react";
import MetricsCard from "./MetricsCard";
import UserGrowthLineChart from "../dashboard/UserGrowthAnalyticsChart";

const AnalyticsTab = ({ analytics, payments, currentAdmins, loginEvents, isDarkMode }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          icon="👥"
          title="Daily Active Users"
          value={analytics.dailyActiveUsers}
          isDarkMode={isDarkMode}
        />
        <MetricsCard
          icon="📅"
          title="Monthly Active Users"
          value={analytics.monthlyActiveUsers}
          isDarkMode={isDarkMode}
        />
        <MetricsCard
          icon="💰"
          title="Today's Revenue"
          value={`SGD $${analytics.todayRevenue.toFixed(2)}`}
          isDarkMode={isDarkMode}
        />
        <MetricsCard
          icon="💎"
          title="Total Revenue"
          value={`SGD $${analytics.totalRevenue.toFixed(2)}`}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Active Users Trend */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className="text-lg font-semibold mb-4">7-Day Active Users Trend</h3>
          <div className="space-y-2">
            {analytics.activeUsersByDay.map((day, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {day.date}
                </span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${Math.max(day.activeUsers * 10, 4)}px` }}
                  ></div>
                  <span className="text-sm font-medium w-8 text-right">{day.activeUsers}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Revenue Trend */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className="text-lg font-semibold mb-4">7-Day Revenue Trend</h3>
          <div className="space-y-2">
            {analytics.revenueByDay.map((day, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {day.date}
                </span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-green-500 h-2 rounded"
                    style={{ width: `${Math.max(day.revenue * 2, 4)}px` }}
                  ></div>
                  <span className="text-sm font-medium w-16 text-right">${day.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Method Breakdown */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className="text-lg font-semibold mb-4">Login Method Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.loginMethodBreakdown).map(([method, count]) => (
              <div key={method} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    method === 'google_oauth' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : method === 'email_link'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {method.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Summary */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>This Month</span>
              <span className="font-semibold text-green-600">SGD ${analytics.monthRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Payments</span>
              <span className="font-medium">{payments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg. Payment</span>
              <span className="font-medium">
                SGD ${payments.length > 0 ? (analytics.totalRevenue / payments.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Line Chart */}
      <UserGrowthLineChart 
        loginEvents={loginEvents}
        payments={payments}
        allUsers={currentAdmins}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default AnalyticsTab;