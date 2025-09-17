import React, { useMemo } from "react";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const UserGrowthBubbleChart = ({ loginEvents = [], payments = [], isDarkMode }) => {
  const bubbleData = useMemo(() => {
    if (!loginEvents.length && !payments.length) {
      return { datasets: [] };
    }

    // Process data to get cumulative counts over time
    const allEvents = [];
    
    // Add user registration events (first login for each user)
    const userFirstLogins = new Map();
    loginEvents
      .filter(event => event.status === 'success')
      .forEach(event => {
        const email = event.email;
        const timestamp = event.timestamp;
        if (!userFirstLogins.has(email) || timestamp < userFirstLogins.get(email)) {
          userFirstLogins.set(email, timestamp);
        }
      });

    userFirstLogins.forEach((timestamp, email) => {
      allEvents.push({
        type: 'user_signup',
        timestamp,
        email,
        amount: 0
      });
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

    // Calculate cumulative counts and create bubble data points
    const bubblePoints = [];
    let cumulativeUsers = 0;
    let cumulativePurchases = 0;
    const seenUsers = new Set();
    const purchasingUsers = new Set();

    // Group events by day for better visualization
    const dailyData = new Map();
    
    allEvents.forEach(event => {
      const date = new Date(event.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          timestamp: date.setHours(0, 0, 0, 0),
          newUsers: 0,
          newPurchases: 0,
          totalAmount: 0
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
        dayData.totalAmount += event.amount;
      }
    });

    // Convert daily data to bubble points
    Array.from(dailyData.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(dayData => {
        cumulativeUsers += dayData.newUsers;
        cumulativePurchases += dayData.newPurchases;
        
        // Create bubble point
        if (cumulativeUsers > 0 || cumulativePurchases > 0) {
          bubblePoints.push({
            x: cumulativeUsers,
            y: cumulativePurchases, 
            r: Math.max(Math.sqrt(dayData.totalAmount) * 2, 5), // Size based on daily payment amount
            timestamp: dayData.timestamp,
            dailyAmount: dayData.totalAmount,
            dailyUsers: dayData.newUsers,
            dailyPurchases: dayData.newPurchases
          });
        }
      });

    return {
      datasets: [
        {
          label: 'User Growth & Purchases',
          data: bubblePoints,
          backgroundColor: isDarkMode 
            ? 'rgba(59, 130, 246, 0.6)'  // blue-500 with opacity
            : 'rgba(37, 99, 235, 0.6)',  // blue-600 with opacity
          borderColor: isDarkMode 
            ? 'rgba(59, 130, 246, 1)'
            : 'rgba(37, 99, 235, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [loginEvents, payments, isDarkMode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
            const point = tooltipItems[0];
            const data = point.raw;
            return `Date: ${new Date(data.timestamp).toLocaleDateString()}`;
          },
          label: (tooltipItem) => {
            const data = tooltipItem.raw;
            const lines = [
              `Total Users: ${data.x}`,
              `Total Purchasers: ${data.y}`,
              `Daily Revenue: SGD $${data.dailyAmount.toFixed(2)}`,
              `New Users Today: ${data.dailyUsers}`,
              `New Purchasers Today: ${data.dailyPurchases}`
            ];
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
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
      y: {
        title: {
          display: true,
          text: 'Cumulative Users with Purchases',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
        },
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#4b5563',
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  // Calculate summary stats
  const totalUsers = new Set(
    loginEvents
      .filter(event => event.status === 'success')
      .map(event => event.email)
  ).size;

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
            Cumulative growth over time (bubble size = daily revenue)
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
        {bubbleData.datasets.length > 0 && bubbleData.datasets[0].data.length > 0 ? (
          <Bubble data={bubbleData} options={chartOptions} />
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
        Each bubble represents a day with user activity. X-axis shows cumulative users, Y-axis shows cumulative purchasing users, bubble size represents daily revenue amount.
      </div>
    </div>
  );
};

export default UserGrowthBubbleChart;