import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FloorLevelChart = ({ data, isDarkMode }) => {
  const floorAnalysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter valid data
    const validData = data.filter(flat => flat.level != null && flat.price != null);
    if (validData.length === 0) return null;

    // Define floor ranges for better visualization
    const ranges = [
      { key: 'low', label: 'Low Floor\n(1-5)', min: 1, max: 5 },
      { key: 'mid-low', label: 'Mid-Low\n(6-10)', min: 6, max: 10 },
      { key: 'mid-high', label: 'Mid-High\n(11-15)', min: 11, max: 15 },
      { key: 'high', label: 'High Floor\n(16+)', min: 16, max: Infinity }
    ];

    // Group data by floor ranges
    const rangeData = ranges.map(range => {
      const unitsInRange = validData.filter(
        flat => flat.level >= range.min && flat.level <= range.max
      );

      if (unitsInRange.length === 0) {
        return {
          ...range,
          count: 0,
          avgPrice: 0,
          avgPricePerSqm: 0,
          avgResaleValue: 0,
          avgROI: 0,
          minPrice: 0,
          maxPrice: 0
        };
      }

      const prices = unitsInRange.map(u => u.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Calculate price per sqm
      const validPricePerSqm = unitsInRange
        .filter(u => u.size_sqm)
        .map(u => u.price / u.size_sqm);
      const avgPricePerSqm = validPricePerSqm.length > 0
        ? validPricePerSqm.reduce((a, b) => a + b, 0) / validPricePerSqm.length
        : 0;

      // Calculate resale value and ROI
      const validResale = unitsInRange.filter(u => u.approximate_resale_value);
      const avgResaleValue = validResale.length > 0
        ? validResale.reduce((a, b) => a + b.approximate_resale_value, 0) / validResale.length
        : 0;

      const avgROI = validResale.length > 0 && avgPrice > 0
        ? ((avgResaleValue - avgPrice) / avgPrice) * 100
        : 0;

      return {
        ...range,
        count: unitsInRange.length,
        avgPrice: Math.round(avgPrice),
        avgPricePerSqm: Math.round(avgPricePerSqm),
        avgResaleValue: Math.round(avgResaleValue),
        avgROI: parseFloat(avgROI.toFixed(1)),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      };
    }).filter(range => range.count > 0); // Only include ranges with units

    return rangeData;
  }, [data]);

  if (!floorAnalysis || floorAnalysis.length === 0) {
    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          📊 Floor Level Analysis
        </h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          No floor level data available for the current filters
        </p>
      </div>
    );
  }

  // Prepare chart data
  const labels = floorAnalysis.map(r => r.label);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Unit Count',
        data: floorAnalysis.map(r => r.count),
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.7)' : 'rgba(37, 99, 235, 0.7)',
        borderColor: isDarkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2
      },
      {
        label: 'Avg Price ($k)',
        data: floorAnalysis.map(r => Math.round(r.avgPrice / 1000)),
        backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.7)' : 'rgba(22, 163, 74, 0.7)',
        borderColor: isDarkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
        order: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#e2e8f0' : '#4a5568',
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#f8fafc' : '#1e293b',
        bodyColor: isDarkMode ? '#e2e8f0' : '#475569',
        borderColor: isDarkMode ? '#475569' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            return floorAnalysis[index].label.replace('\n', ' ');
          },
          afterTitle: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const range = floorAnalysis[index];
            return `${range.count} unit${range.count !== 1 ? 's' : ''} available`;
          },
          label: (context) => {
            const index = context.dataIndex;
            const range = floorAnalysis[index];
            
            if (context.dataset.label === 'Unit Count') {
              return `Units: ${range.count}`;
            } else {
              return `Avg Price: $${range.avgPrice.toLocaleString()}`;
            }
          },
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const range = floorAnalysis[index];
            
            const lines = [
              '',
              `Price Range: $${range.minPrice.toLocaleString()} - $${range.maxPrice.toLocaleString()}`,
              `Avg Price/sqm: $${range.avgPricePerSqm.toLocaleString()}/sqm`
            ];
            
            if (range.avgResaleValue > 0) {
              lines.push(`Avg Resale Est: $${range.avgResaleValue.toLocaleString()}`);
              lines.push(`Avg ROI: ${range.avgROI >= 0 ? '+' : ''}${range.avgROI}%`);
            }
            
            return lines;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Units',
          color: isDarkMode ? '#e2e8f0' : '#4a5568',
          font: { size: 12 }
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 },
          stepSize: 5
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Average Price ($k)',
          color: isDarkMode ? '#e2e8f0' : '#4a5568',
          font: { size: 12 }
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 },
          callback: (value) => `$${value}k`
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  // Find best value floor (best ROI with reasonable unit availability)
  const bestValueFloor = floorAnalysis.reduce((best, current) => {
    if (!best || (current.avgROI > best.avgROI && current.count >= 5)) {
      return current;
    }
    return best;
  }, null);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          📊 Floor Level Analysis
        </h3>
      </div>

      <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
        Compare unit availability and pricing across different floor levels
      </p>

      {/* Chart */}
      <div style={{ height: '350px', marginBottom: '16px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Insights Summary */}
      <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-blue-50'}`}>
        <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
          💡 Key Insights
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Most Available:
            </span>{' '}
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              {floorAnalysis.reduce((max, r) => r.count > max.count ? r : max).label.replace('\n', ' ')} 
              ({floorAnalysis.reduce((max, r) => r.count > max.count ? r : max).count} units)
            </span>
          </div>
          
          {bestValueFloor && bestValueFloor.avgROI > 0 && (
            <div>
              <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Best ROI:
              </span>{' '}
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                {bestValueFloor.label.replace('\n', ' ')} (+{bestValueFloor.avgROI}%)
              </span>
            </div>
          )}
          
          <div>
            <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Price Range:
            </span>{' '}
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              ${Math.min(...floorAnalysis.map(r => r.minPrice)).toLocaleString()} - 
              ${Math.max(...floorAnalysis.map(r => r.maxPrice)).toLocaleString()}
            </span>
          </div>
          
          <div>
            <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Total Units:
            </span>{' '}
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              {floorAnalysis.reduce((sum, r) => sum + r.count, 0)} across all floors
            </span>
          </div>
        </div>
      </div>

      {/* Buyer Tips */}
      <div className={`mt-3 p-3 rounded-lg text-xs ${isDarkMode ? 'bg-slate-800/30 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
        <p className="mb-1">
          <span className="font-semibold">💡 Buyer's Tip:</span> Higher floors typically command higher prices but may offer better views and less noise.
          Mid-level floors often provide the best balance between price and livability.
        </p>
      </div>
    </div>
  );
};

export default React.memo(FloorLevelChart);
