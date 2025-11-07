import React, { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, TimeScale, Tooltip, Legend);

const UserGrowthLineChart = ({ loginEvents = [], payments = [], allUsers = [], isDarkMode }) => {
  const chartData = useMemo(() => {
    if (!allUsers.length && !payments.length) {
      return { datasets: [] };
    }

    // Process data to get cumulative counts over time
    const allEvents = [];
    
    // Add user registration events based on Firebase Auth creationTime
    allUsers.forEach(user => {
      if (user.email) {
        // Check for creationTime in both possible locations:
        // - user.creationTime (test data format)
        // - user.metadata.creationTime (real Firebase Auth format)
        const creationTime = user.creationTime || user.metadata?.creationTime;
        if (creationTime) {
          // Parse creationTime to timestamp
          const timestamp = new Date(creationTime).getTime();
          allEvents.push({
            type: 'user_signup',
            timestamp,
            email: user.email,
            amount: 0
          });
        }
      }
    });

    // Add payment events
    payments.forEach(payment => {
      const timestamp = payment.timestamp?.toDate ? payment.timestamp.toDate().getTime() : payment.timestamp;
      allEvents.push({
        type: 'purchase',
        timestamp,
        email: payment.customerEmail,
        amount: payment.amount || 0
      });
    });

    // Sort events by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Group events by day and calculate cumulative values
    const dailyData = new Map();
    const seenUsers = new Set();
    const purchasingUsers = new Set();
    
    allEvents.forEach(event => {
      const date = new Date(event.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          newUsers: 0,
          newPurchases: 0,
          dailyRevenue: 0
        });
      }
      
      const dayData = dailyData.get(dayKey);
      
      if (event.type === 'user_signup' && !seenUsers.has(event.email)) {
        seenUsers.add(event.email);
        dayData.newUsers++;
      } else if (event.type === 'purchase') {
        if (!purchasingUsers.has(event.email)) {
          purchasingUsers.add(event.email);
          dayData.newPurchases++;
        }
        dayData.dailyRevenue += event.amount;
      }
    });

    // Convert to time series data
    const timeSeriesData = Array.from(dailyData.values())
      .sort((a, b) => a.date - b.date);

    let cumulativeUsers = 0;
    let cumulativePurchases = 0;
    let cumulativeRevenue = 0;

    const dataPoints = timeSeriesData.map(dayData => {
      cumulativeUsers += dayData.newUsers;
      cumulativePurchases += dayData.newPurchases;
      cumulativeRevenue += dayData.dailyRevenue;
      
      return {
        x: dayData.date,
        cumulativeUsers,
        cumulativePurchases,
        dailyRevenue: dayData.dailyRevenue,
        cumulativeRevenue
      };
    });

    // Create datasets for the chart
    const datasets = [
      {
        label: 'Cumulative Users',
        data: dataPoints.map(point => ({ x: point.x, y: point.cumulativeUsers })),
        borderColor: isDarkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Cumulative Paying Users',
        data: dataPoints.map(point => ({ x: point.x, y: point.cumulativePurchases })),
        borderColor: isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)',
        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Cumulative Revenue (SGD)',
        data: dataPoints.map(point => ({ x: point.x, y: point.cumulativeRevenue })),
        borderColor: isDarkMode ? 'rgba(168, 85, 247, 1)' : 'rgba(147, 51, 234, 1)',
        backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
        type: 'line',
      },
      {
        label: 'Daily Revenue (SGD)',
        data: dataPoints.map(point => ({ x: point.x, y: point.dailyRevenue })),
        backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.7)' : 'rgba(245, 158, 11, 0.7)',
        borderColor: isDarkMode ? 'rgba(251, 191, 36, 1)' : 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
        type: 'bar',
      }
    ];

    return { datasets };
  }, [allUsers, payments, isDarkMode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: isDarkMode ? '#f8fafc' : '#1e293b',
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#fff' : '#000',
        bodyColor: isDarkMode ? '#fff' : '#000',
        borderColor: isDarkMode ? '#555' : '#ccc',
        borderWidth: 1,
        callbacks: {
          title: (tooltipItems) => {
            const date = new Date(tooltipItems[0].parsed.x);
            return `Date: ${date.toLocaleDateString()}`;
          },
          label: (tooltipItem) => {
            const datasetLabel = tooltipItem.dataset.label;
            const value = tooltipItem.parsed.y;
            if (datasetLabel.includes('Revenue')) {
              return `${datasetLabel}: SGD $${value.toFixed(2)}`;
            }
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd',
            month: 'MMM yyyy'
          },
          tooltipFormat: 'MMM dd, yyyy'
        },
        title: {
          display: true,
          text: 'Date',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
        },
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#4b5563',
          maxTicksLimit: 10,
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cumulative Users',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
        },
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#4b5563',
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Revenue (SGD)',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
        },
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#4b5563',
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Calculate summary stats
  const totalUsers = allUsers.length;

  const totalPurchasingUsers = new Set(
    payments.map(payment => payment.customerEmail)
  ).size;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
            User Growth & Purchase Analytics
          </h3>
          <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Cumulative user growth, cumulative & daily revenue over time
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Total Users
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {totalUsers}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Purchasing Users
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {totalPurchasingUsers}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Conversion Rate
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {totalUsers > 0 ? ((totalPurchasingUsers / totalUsers) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div style={{ height: "400px" }} className="mb-4">
        {chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0 ? (
          <Chart type="bar" data={chartData} options={chartOptions} />
        ) : (
          <div
            className={`h-full flex items-center justify-center ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <span className="text-sm">No data available for visualization</span>
          </div>
        )}
      </div>

      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        Time series showing cumulative user growth (left Y-axis), cumulative revenue and daily revenue bars (right Y-axis) over time.
      </div>
    </div>
  );
};

export default UserGrowthLineChart;