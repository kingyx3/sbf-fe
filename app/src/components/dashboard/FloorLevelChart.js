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
  // Helper function for level categorization
  const getLevelCategory = (level) => {
    if (level <= 5) return "Low (1-5)";
    if (level <= 10) return "Mid-Low (6-10)";
    if (level <= 15) return "Mid (11-15)";
    if (level <= 20) return "Mid-High (16-20)";
    return "High (21+)";
  };

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
          sizeSqm: flat.size_sqm,
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (floorLevelData.length === 0) {
      return {
        totalUnits: 0,
        avgPrice: 0,
        minLevel: 0,
        maxLevel: 0,
        avgLevel: 0,
        priceCorrelation: 0,
      };
    }

    const prices = floorLevelData.map(p => p.y);
    const levels = floorLevelData.map(p => p.x);
    
    // Calculate correlation between floor level and price
    const avgLevel = levels.reduce((sum, l) => sum + l, 0) / levels.length;
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    let numerator = 0;
    let denomLevel = 0;
    let denomPrice = 0;
    
    for (let i = 0; i < levels.length; i++) {
      const levelDiff = levels[i] - avgLevel;
      const priceDiff = prices[i] - avgPrice;
      numerator += levelDiff * priceDiff;
      denomLevel += levelDiff * levelDiff;
      denomPrice += priceDiff * priceDiff;
    }
    
    const correlation = denomLevel * denomPrice > 0 ? numerator / Math.sqrt(denomLevel * denomPrice) : 0;
    
    return {
      totalUnits: floorLevelData.length,
      avgPrice,
      minLevel: Math.min(...levels),
      maxLevel: Math.max(...levels),
      avgLevel,
      priceCorrelation: correlation,
    };
  }, [floorLevelData]);

  // Calculate enhanced level category statistics with value analysis
  const levelCategoryStats = useMemo(() => {
    if (floorLevelData.length === 0) return [];
    
    const categories = {};
    
    floorLevelData.forEach((point) => {
      const category = getLevelCategory(point.x);
      if (!categories[category]) {
        categories[category] = { 
          prices: [], 
          resaleValues: [], 
          pricePsfs: [],
          rois: [],
          count: 0 
        };
      }
      categories[category].prices.push(point.y);
      if (point.resaleValue) {
        categories[category].resaleValues.push(point.resaleValue);
        const roi = ((point.resaleValue - point.y) / point.y) * 100;
        categories[category].rois.push(roi);
      }
      if (point.pricePsf) {
        categories[category].pricePsfs.push(point.pricePsf);
      }
      categories[category].count++;
    });

    const overallAvgPrice = floorLevelData.reduce((sum, p) => sum + p.y, 0) / floorLevelData.length;

    return Object.entries(categories)
      .map(([category, data]) => {
        const avgPrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
        const avgResale = data.resaleValues.length > 0 
          ? data.resaleValues.reduce((sum, p) => sum + p, 0) / data.resaleValues.length 
          : null;
        const avgROI = data.rois.length > 0
          ? data.rois.reduce((sum, r) => sum + r, 0) / data.rois.length
          : null;
        const avgPricePsf = data.pricePsfs.length > 0
          ? data.pricePsfs.reduce((sum, p) => sum + p, 0) / data.pricePsfs.length
          : null;
        const pricePremium = ((avgPrice - overallAvgPrice) / overallAvgPrice) * 100;
        
        return {
          category,
          avgPrice,
          avgResale,
          avgROI,
          avgPricePsf,
          pricePremium,
          count: data.count,
          priceRange: {
            min: Math.min(...data.prices),
            max: Math.max(...data.prices),
          },
        };
      })
      .sort((a, b) => {
        const order = ["Low (1-5)", "Mid-Low (6-10)", "Mid (11-15)", "Mid-High (16-20)", "High (21+)"];
        return order.indexOf(a.category) - order.indexOf(b.category);
      });
  }, [floorLevelData]);

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

  // Enhanced color coding based on value analysis
  const getPointColor = (point, dataType = 'price') => {
    if (dataType === 'resale') {
      // Green tones for resale values
      return isDarkMode ? "rgba(34, 197, 94, 0.7)" : "rgba(22, 163, 74, 0.7)";
    }
    
    // Color code based on price per sqm if available
    if (point.pricePsf && point.sizeSqm) {
      const pricePerSqm = point.pricePsf * 10.764; // Convert PSF to PSM
      const avgPricePerSqm = floorLevelData
        .filter(p => p.pricePsf && p.sizeSqm)
        .reduce((sum, p) => sum + (p.pricePsf * 10.764), 0) / 
        floorLevelData.filter(p => p.pricePsf && p.sizeSqm).length;
      
      const priceRatio = pricePerSqm / avgPricePerSqm;
      
      if (priceRatio >= 1.1) return isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)"; // Expensive - Red
      if (priceRatio >= 1.05) return isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)"; // Above average - Orange
      if (priceRatio >= 0.95) return isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)"; // Average - Blue
      return isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)"; // Good value - Green
    }
    
    // Default color if no price per sqm data
    return isDarkMode ? "rgba(59, 130, 246, 0.6)" : "rgba(37, 99, 235, 0.6)";
  };

  const chartData = {
    datasets: [
      {
        label: "SBF Price",
        data: floorLevelData,
        backgroundColor: floorLevelData.map(point => getPointColor(point, 'price')),
        borderColor: floorLevelData.map(point => getPointColor(point, 'price')),
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      ...(resaleData.length > 0 ? [{
        label: "Est. Resale Value",
        data: resaleData,
        backgroundColor: resaleData.map(point => getPointColor(point, 'resale')),
        borderColor: resaleData.map(point => getPointColor(point, 'resale')),
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
                if (point.sizeSqm) {
                  const pricePerSqm = point.pricePsf * 10.764;
                  lines.push(`Price PSM: $${pricePerSqm.toFixed(0)}`);
                }
              }
              if (point.resaleValue) {
                lines.push(`Est. Resale: ${formatCurrency(point.resaleValue)}`);
                const roi = ((point.resaleValue - point.y) / point.y * 100);
                lines.push(`Potential ROI: ${roi.toFixed(1)}%`);
              }
              
              // Add floor premium analysis
              const avgPriceForLevel = floorLevelData
                .filter(p => Math.abs(p.x - point.x) <= 2)
                .reduce((sum, p) => sum + p.y, 0) / 
                floorLevelData.filter(p => Math.abs(p.x - point.x) <= 2).length;
              
              if (avgPriceForLevel && Math.abs(point.y - avgPriceForLevel) > avgPriceForLevel * 0.02) {
                const premium = ((point.y - avgPriceForLevel) / avgPriceForLevel * 100);
                lines.push(`Floor Premium: ${premium > 0 ? '+' : ''}${premium.toFixed(1)}%`);
              }
              
            } else {
              lines.push(`Est. Resale: ${formatCurrency(point.y)}`);
              if (point.price) {
                lines.push(`SBF Price: ${formatCurrency(point.price)}`);
                const roi = ((point.y - point.price) / point.price * 100);
                lines.push(`Potential ROI: ${roi.toFixed(1)}%`);
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

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
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
            Price Correlation
          </p>
          <p className={`text-lg font-bold ${
            stats.priceCorrelation > 0.3 
              ? "text-green-600" 
              : stats.priceCorrelation < -0.3 
                ? "text-red-600" 
                : isDarkMode ? "text-yellow-400" : "text-yellow-600"
          }`}>
            {stats.priceCorrelation > 0 ? '+' : ''}{(stats.priceCorrelation * 100).toFixed(0)}%
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

      {/* Analytical Insights */}
      <div className={`mb-6 p-4 rounded-lg border-l-4 ${
        stats.priceCorrelation > 0.3 
          ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500"
          : stats.priceCorrelation < -0.3 
            ? "bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500"
            : "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500"
      }`}>
        <h4 className={`text-sm font-semibold mb-2 ${
          stats.priceCorrelation > 0.3 
            ? "text-green-800 dark:text-green-200"
            : stats.priceCorrelation < -0.3 
              ? "text-red-800 dark:text-red-200"
              : "text-yellow-800 dark:text-yellow-200"
        }`}>
          📊 Market Insight
        </h4>
        <p className={`text-xs ${
          stats.priceCorrelation > 0.3 
            ? "text-green-700 dark:text-green-300"
            : stats.priceCorrelation < -0.3 
              ? "text-red-700 dark:text-red-300"
              : "text-yellow-700 dark:text-yellow-300"
        }`}>
          {stats.priceCorrelation > 0.3 
            ? `Strong positive correlation (${(stats.priceCorrelation * 100).toFixed(0)}%) - Higher floors typically command premium prices in this development.`
            : stats.priceCorrelation < -0.3 
              ? `Negative correlation (${(stats.priceCorrelation * 100).toFixed(0)}%) - Lower floors may offer better value in this development.`
              : `Weak correlation (${(stats.priceCorrelation * 100).toFixed(0)}%) - Floor level has minimal impact on pricing in this development.`
          }
          {floorLevelData.some(p => p.pricePsf) && (
            <span className="block mt-1">
              💡 Points are color-coded: <span className="text-green-600 font-medium">Green = Good Value</span>, 
              <span className="text-blue-600 font-medium"> Blue = Average</span>, 
              <span className="text-red-600 font-medium"> Red = Premium</span>
            </span>
          )}
        </p>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <Scatter data={chartData} options={chartOptions} />
      </div>

      {/* Enhanced Level Category Analysis */}
      <div className="mt-8">
        <h4 className={`text-sm font-medium mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Comprehensive Analysis by Floor Level Category
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
              <div className={`text-sm font-medium mb-3 flex items-center justify-between ${isDarkMode ? "text-white" : "text-black"}`}>
                <span>{stat.category}</span>
                {stat.pricePremium !== 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stat.pricePremium > 5 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : stat.pricePremium > 0 
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}>
                    {stat.pricePremium > 0 ? '+' : ''}{stat.pricePremium.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span>Avg Price:</span>
                  <span className="font-semibold">{formatCurrencyShort(stat.avgPrice)}</span>
                </div>
                {stat.avgPricePsf && (
                  <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span>Avg PSF:</span>
                    <span className="font-semibold">${stat.avgPricePsf.toFixed(0)}</span>
                  </div>
                )}
                {stat.avgResale && (
                  <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span>Avg Resale:</span>
                    <span className="font-semibold text-green-600">{formatCurrencyShort(stat.avgResale)}</span>
                  </div>
                )}
                {stat.avgROI !== null && (
                  <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span>Avg ROI:</span>
                    <span className={`font-semibold ${
                      stat.avgROI >= 30 
                        ? "text-green-600" 
                        : stat.avgROI >= 15 
                          ? "text-blue-600" 
                          : "text-yellow-600"
                    }`}>
                      {stat.avgROI.toFixed(1)}%
                    </span>
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
        
        {/* Value Legend */}
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? "bg-slate-800/50" : "bg-gray-50"}`}>
          <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            💡 Reading the Analysis:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <span className="font-medium">Price Premium:</span> How much more/less this floor category costs vs. average
            </p>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <span className="font-medium">Chart Colors:</span> Red=Premium pricing, Blue=Average, Green=Good value
            </p>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <span className="font-medium">ROI Color:</span> Green≥30%, Blue≥15%, Yellow&lt;15%
            </p>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <span className="font-medium">Correlation:</span> Measures how strongly floor level affects pricing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorLevelChart;