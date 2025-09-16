import React, { useMemo, useRef, useCallback } from "react";
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
import { formatCurrency } from "../helpers";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ROIAnalysisChart = ({ data, isDarkMode }) => {
  const roiData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((flat) => flat.approximate_resale_value && flat.price)
      .map((flat) => {
        const roiPercentage = ((flat.approximate_resale_value - flat.price) / flat.price) * 100;
        const potentialProfit = flat.approximate_resale_value - flat.price;

        return {
          x: flat.price,
          y: roiPercentage,
          profit: potentialProfit,
          resaleValue: flat.approximate_resale_value,
          block: flat.block,
          unit: flat.unit,
          project: flat.project_name,
          town: flat.project_town,
          flatType: flat.flat_type,
        };
      });
  }, [data]);

  const hasData = roiData.length > 0;

  if (!hasData) {
    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
          ROI Analysis - Potential Returns
        </h3>
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          No resale value data available for ROI analysis
        </p>
      </div>
    );
  }

  const getPointColor = (roiPercentage) => {
    if (roiPercentage >= 50) return isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)";
    if (roiPercentage >= 30) return isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)";
    if (roiPercentage >= 10) return isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)";
    return isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)";
  };

  const chartData = {
    datasets: [
      {
        label: "ROI Potential (%)",
        data: roiData,
        backgroundColor: roiData.map((point) => getPointColor(point.y)),
        borderColor: roiData.map((point) => getPointColor(point.y)),
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: "top",
        labels: {
          color: isDarkMode ? "#fff" : "#000",
          boxWidth: 12,
          padding: 15,
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
            lines.push(`SBF Price: ${formatCurrency(point.x)}`);
            lines.push(`Est. Resale: ${formatCurrency(point.resaleValue)}`);
            lines.push(`Potential Profit: ${formatCurrency(point.profit)}`);
            lines.push(`ROI: ${point.y.toFixed(1)}%`);
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
          text: "SBF Price (SGD)",
          color: isDarkMode ? "#e2e8f0" : "#4a5568",
          font: { size: 12, weight: "bold" },
        },
        ticks: {
          color: isDarkMode ? "#fff" : "#000",
          callback: (value) => formatCurrency(value),
        },
        grid: {
          color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "ROI Potential (%)",
          color: isDarkMode ? "#e2e8f0" : "#4a5568",
          font: { size: 12, weight: "bold" },
        },
        ticks: {
          color: isDarkMode ? "#fff" : "#000",
          callback: (value) => `${value}%`,
        },
        grid: {
          color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
        },
      },
    },
  };

  // Summary stats
  const avgROI = roiData.reduce((sum, p) => sum + p.y, 0) / roiData.length;
  const maxROI = Math.max(...roiData.map((p) => p.y));
  const highROICount = roiData.filter((p) => p.y >= 30).length;

  // Build ALL town × flattype combinations (sorted by avg ROI desc)
  const allCombinations = useMemo(() => {
    if (!roiData || roiData.length === 0) return [];

    const map = {};
    roiData.forEach((p) => {
      const key = `${p.town}__${p.flatType}`;
      if (!map[key]) {
        map[key] = {
          town: p.town,
          flatType: p.flatType,
          roiSum: 0,
          profitSum: 0,
          count: 0,
          minROI: p.y,
          maxROI: p.y,
        };
      }
      map[key].roiSum += p.y;
      map[key].profitSum += p.profit;
      map[key].count += 1;
      map[key].minROI = Math.min(map[key].minROI, p.y);
      map[key].maxROI = Math.max(map[key].maxROI, p.y);
    });

    return Object.values(map)
      .map((c) => ({
        town: c.town,
        flatType: c.flatType,
        avgROI: c.roiSum / c.count,
        avgProfit: c.profitSum / c.count,
        minROI: c.minROI,
        maxROI: c.maxROI,
        count: c.count,
      }))
      .sort((a, b) => b.avgROI - a.avgROI || b.avgProfit - a.avgProfit || b.count - a.count);
  }, [roiData]);

  // UI helpers
  const badgeTone = (val) =>
    val >= 50
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : val >= 30
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      : val >= 10
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";

  const valueTone = (val) =>
    val >= 50 ? "text-green-500" : val >= 30 ? "text-blue-500" : val >= 10 ? "text-yellow-500" : "text-red-500";

  // Horizontal scroll controls
  const railRef = useRef(null);
  const scrollBy = useCallback((dir) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  }, []);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
          ROI Analysis - Investment Potential
        </h3>
        <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {roiData.length} units analyzed
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Average ROI</p>
          <p className={`text-lg font-bold ${valueTone(avgROI)}`}>{avgROI.toFixed(1)}%</p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Best ROI</p>
          <p className="text-lg font-bold text-green-500">{maxROI.toFixed(1)}%</p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>High ROI Units</p>
          <p className="text-lg font-bold text-blue-500">{highROICount} units (≥30%)</p>
        </div>
      </div>

      {/* Scatter */}
      <div style={{ height: "400px" }}>
        <Scatter data={chartData} options={chartOptions} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>High ROI (≥50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Good ROI (30-49%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Decent ROI (10-29%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Low ROI (&lt;10%)</span>
        </div>
      </div>

      {/* ALL combinations: horizontal scroll list */}
      {allCombinations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              All Town × Flat Type Combinations (sorted by Avg ROI)
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                className={`px-2 py-1 rounded-md border text-sm ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-600 text-gray-200 hover:bg-slate-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="Scroll left"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                className={`px-2 py-1 rounded-md border text-sm ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-600 text-gray-200 hover:bg-slate-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          </div>

          <div
            ref={railRef}
            className="overflow-x-auto pb-2"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
          >
            <div className="flex gap-4 pr-2 snap-x snap-mandatory">
              {allCombinations.map((combo) => (
                <div
                  key={`${combo.town}_${combo.flatType}`}
                  className={`snap-start shrink-0 min-w-[260px] w-72 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-600 hover:border-slate-500"
                      : "bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeTone(combo.avgROI)}`}>
                      {combo.flatType}
                    </div>
                    <span className={`text-lg font-bold ${valueTone(combo.avgROI)}`}>
                      {combo.avgROI.toFixed(1)}%
                    </span>
                  </div>

                  <h5
                    className={`text-base font-semibold mb-2 truncate ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    title={combo.town}
                  >
                    {combo.town}
                  </h5>

                  <div className="space-y-2">
                    <div className={`flex justify-between items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <span>Avg Gain:</span>
                      <span className="font-semibold text-green-500">{formatCurrency(combo.avgProfit)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <span>ROI Range:</span>
                      <span className="font-medium">
                        {combo.minROI.toFixed(1)}% - {combo.maxROI.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`flex justify-between items-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <span>Units:</span>
                      <span className="font-medium">
                        {combo.count} unit{combo.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle note for UX */}
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Tip: Swipe/scroll horizontally to view more combinations.
          </p>
        </div>
      )}
    </div>
  );
};

export default ROIAnalysisChart;