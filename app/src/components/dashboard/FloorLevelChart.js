import React, { useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatCurrency, formatCurrencyShort } from "../helpers";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FloorLevelChart = ({ data, isDarkMode }) => {
  const floorLevelData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((flat) => flat.level && flat.price && flat.level > 0)
      .map((flat) => {
        return {
          x: flat.level,
          y: flat.price,
          resaleValue: flat.approximate_resale_value,
          block: flat.block,
          unit: flat.unit,
          project: flat.project_name,
          town: flat.project_town,
          flatType: flat.flat_type,
          pricePsf: flat.price_psf,
        };
      });
  }, [data]);

  const resaleData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((flat) => flat.level && flat.approximate_resale_value && flat.level > 0)
      .map((flat) => {
        return {
          x: flat.level,
          y: flat.approximate_resale_value,
          price: flat.price,
          block: flat.block,
          unit: flat.unit,
          project: flat.project_name,
          town: flat.project_town,
          flatType: flat.flat_type,
        };
      });
  }, [data]);

  const hasData = floorLevelData.length > 0;

  if (!hasData) {
    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
          Floor Level Analysis
        </h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          No floor level data available for analysis
        </p>
      </div>
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const prices = floorLevelData.map(p => p.y);
    const levels = floorLevelData.map(p => p.x);
    
    return {
      totalUnits: floorLevelData.length,
      avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      minLevel: Math.min(...levels),
      maxLevel: Math.max(...levels),
      avgLevel: levels.reduce((sum, l) => sum + l, 0) / levels.length,
    };
  }, [floorLevelData]);

  const chartData = {
    datasets: [
      {
        label: "SBF Price",
        data: floorLevelData,
        backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.6)" : "rgba(37, 99, 235, 0.6)",
        borderColor: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      ...(resaleData.length > 0 ? [{
        label: "Est. Resale Value",
        data: resaleData,
        backgroundColor: isDarkMode ? "rgba(34, 197, 94, 0.6)" : "rgba(22, 163, 74, 0.6)",
        borderColor: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)",
        pointRadius: 4,
        pointHoverRadius: 6,
      }] : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: isDarkMode ? "#e2e8f0" : "#4a5568",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#fff" : "#000",
        bodyColor: isDarkMode ? "#fff" : "#000",
        borderColor: isDarkMode ? "#555" : "#ccc",
        borderWidth: 1,
        callbacks: {
          title: (tooltipItems) => {
            const point = tooltipItems[0].raw;
            return `${point.project} (${point.flatType})`;
          },
          label: (tooltipItem) => {
            const point = tooltipItem.raw;
            const lines = [];
            lines.push(
              point.unit ? `Block ${point.block} • ${point.unit}` : `Block ${point.block}`
            );
            lines.push(`Floor Level: ${point.x}`);
            
            if (tooltipItem.datasetIndex === 0) {
              lines.push(`SBF Price: ${formatCurrency(point.y)}`);
              if (point.pricePsf) {
                lines.push(`Price PSF: $${point.pricePsf}`);
              }
              if (point.resaleValue) {
                lines.push(`Est. Resale: ${formatCurrency(point.resaleValue)}`);
              }
            } else {
              lines.push(`Est. Resale: ${formatCurrency(point.y)}`);
              if (point.price) {
                lines.push(`SBF Price: ${formatCurrency(point.price)}`);
              }
            }
            
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Floor Level",
          color: isDarkMode ? "#e2e8f0" : "#4a5568",
          font: { size: 12, weight: "bold" },
        },
        ticks: {
          color: isDarkMode ? "#cbd5e1" : "#64748b",
          stepSize: 1,
          callback: function(value) {
            return Math.floor(value) === value ? value : '';
          },
        },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price (SGD)",
          color: isDarkMode ? "#e2e8f0" : "#4a5568",
          font: { size: 12, weight: "bold" },
        },
        ticks: {
          color: isDarkMode ? "#cbd5e1" : "#64748b",
          callback: function(value) {
            return formatCurrencyShort(value);
          },
        },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  // Helper function for level categorization
  const getLevelCategory = (level) => {
    if (level <= 5) return "Low (1-5)";
    if (level <= 10) return "Mid-Low (6-10)";
    if (level <= 15) return "Mid (11-15)";
    if (level <= 20) return "Mid-High (16-20)";
    return "High (21+)";
  };

  // Calculate level category statistics
  const levelCategoryStats = useMemo(() => {
    const categories = {};
    floorLevelData.forEach((point) => {
      const category = getLevelCategory(point.x);
      if (!categories[category]) {
        categories[category] = { prices: [], resaleValues: [], count: 0 };
      }
      categories[category].prices.push(point.y);
      if (point.resaleValue) {
        categories[category].resaleValues.push(point.resaleValue);
      }
      categories[category].count++;
    });

    return Object.entries(categories)
      .map(([category, data]) => ({
        category,
        avgPrice: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length,
        avgResale: data.resaleValues.length > 0 
          ? data.resaleValues.reduce((sum, p) => sum + p, 0) / data.resaleValues.length 
          : null,
        count: data.count,
        priceRange: {
          min: Math.min(...data.prices),
          max: Math.max(...data.prices),
        },
      }))
      .sort((a, b) => {
        const order = ["Low (1-5)", "Mid-Low (6-10)", "Mid (11-15)", "Mid-High (16-20)", "High (21+)"];
        return order.indexOf(a.category) - order.indexOf(b.category);
      });
  }, [floorLevelData]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
          Floor Level Analysis - Price & Resale Impact
        </h3>
        <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {stats.totalUnits} units analyzed
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Avg Price
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {formatCurrencyShort(stats.avgPrice)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Avg Floor Level
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {stats.avgLevel.toFixed(1)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Level Range
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {stats.minLevel} - {stats.maxLevel}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Total Units
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {stats.totalUnits}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <Scatter data={chartData} options={chartOptions} />
      </div>

      {/* Level Category Analysis */}
      <div className="mt-8">
        <h4 className={`text-sm font-medium mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Price Analysis by Floor Level Category
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {levelCategoryStats.map((stat) => (
            <div
              key={stat.category}
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? "bg-slate-800 border-slate-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>
                {stat.category}
              </div>
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span>Avg Price:</span>
                  <span className="font-semibold">{formatCurrencyShort(stat.avgPrice)}</span>
                </div>
                {stat.avgResale && (
                  <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span>Avg Resale:</span>
                    <span className="font-semibold text-green-600">{formatCurrencyShort(stat.avgResale)}</span>
                  </div>
                )}
                <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span>Range:</span>
                  <span className="font-medium">
                    {formatCurrencyShort(stat.priceRange.min)} - {formatCurrencyShort(stat.priceRange.max)}
                  </span>
                </div>
                <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <span>Units:</span>
                  <span className="font-medium">
                    {stat.count} unit{stat.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorLevelChart;