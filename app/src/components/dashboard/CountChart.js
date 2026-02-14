import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from "chart.js";
import { Chart } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
);

const CountChart = ({
  data = [],
  demandData = [],
  capturedAt,
  groupBy = "project_town",
  subGroupBy = "flat_type",
  isDarkMode,
  sbfCode,
}) => {
  const [viewMode, setViewMode] = useState("all"); // "all" or "ftf" (First-Timer Families)
  const [showAll, setShowAll] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const isMobile = windowSize.width <= 768;
  const maxVisibleItems = isMobile ? 8 : 12;

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    if (window.innerWidth > 768 && showAll) {
      setShowAll(false);
    }
  }, [showAll]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [handleResize]);

  // ---------- NORMALIZATION HELPERS ----------
  const normalizeGroupValue = (value) => {
    if (!value) return "";
    const jurongVariants = ["Jurong East", "Jurong West", "Jurong East/ West"];
    if (jurongVariants.includes(value)) {
      return "Jurong East / West";
    } else if (value === "Kallang/Whampoa") {
      return "Kallang Whampoa";
    } else if (value === "Central Area") {
      return "Central";
    }
    return value;
  };

  const normalizeSubGroupValue = (value) => {
    if (!value) return "";
    return value.replace("3Gen", "5-room").replace("Executive", "5-room");
  };

  const formatComboLabel = (combo) => {
    return combo
      .replace("-room", "rm")
      .replace(" - ", "-")
      .replace(" Flexi", "")
      .replace("Community Care Apartment", "Com Care Apt")
      .replace("Ang Mo Kio", "AMK")
      .replace("Batok", "B")
      .replace("Central Area", "Central")
      .replace("Panjang", "P")
      .replace("Merah", "M")
      .replace("Choa Chu Kang", "CCK")
      .replace("Jurong East / West", "JE/JW")
      .replace("Jurong East/ West", "JE/JW")
      .replace("Kallang Whampoa", "KW")
      .replace("Toa Payoh", "TPY");
  };

  // ---------- DERIVED MAPS ----------
  const supplyMap = useMemo(() => {
    const map = {};
    (data || []).forEach((item) => {
      const groupVal = normalizeGroupValue(item[groupBy]);
      const subGroupVal = normalizeSubGroupValue(item[subGroupBy]);
      const key = `${groupVal} - ${subGroupVal}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [data, groupBy, subGroupBy]);

  const demandMap = useMemo(() => {
    const map = {};
    (demandData || []).forEach((item) => {
      const townVal = normalizeGroupValue(item.Town);
      const key = `${townVal} - ${item["Flat Type"]}`;
      if (!map[key]) {
        map[key] = {
          total: 0,
          totalSupply: 0,
          ftf: 0,
          fts: 0,
          stf: 0,
          seniors: 0,
        };
      }
      map[key].total += item["Number of Applicants"] || 0;
      map[key].totalSupply += item["Number of Units"] || 0;
      map[key].ftf += item["Estimated Applicants - First-Timer Families"] || 0;
      map[key].fts += item["Estimated Applicants - First-Timer Singles"] || 0;
      map[key].stf += item["Estimated Applicants - Second-Timer Families"] || 0;
      map[key].seniors += item["Estimated Applicants - Seniors"] || 0;
    });
    return map;
  }, [demandData]);

  const comboStats = useMemo(() => {
    return Object.entries(supplyMap)
      .map(([combo, supply]) => {
        const demand = demandMap[combo] || {};
        const total = demand.total || 0;
        const totalSupply = demand.totalSupply || 0;
        const ftf = demand.ftf || 0;

        // Adjust supply for "Great Flat" heuristic
        let adjustedSupply = supply;
        adjustedSupply = combo.includes("Community")
          ? 0
          : combo.includes("Flexi")
          ? Math.floor(supply * 0.54)
          : Math.floor(supply * 0.95);

        let adjustedTotalSupply = totalSupply;
        adjustedTotalSupply = combo.includes("Community")
          ? 0
          : combo.includes("Flexi")
          ? Math.floor(totalSupply * 0.54)
          : Math.floor(totalSupply * 0.95);

        let probability, unfilteredProbability;
        if (viewMode === "ftf") {
          probability =
            ftf > 0 ? Math.min(adjustedSupply / ftf, 0.99) : adjustedSupply > 0 ? 0.99 : 0;
          unfilteredProbability =
            ftf > 0 ? Math.min(adjustedTotalSupply / ftf, 0.99) : adjustedTotalSupply > 0 ? 0.99 : 0;
        } else {
          probability = total > 0 ? Math.min(supply / total, 0.99) : supply > 0 ? 0.99 : 0;
          unfilteredProbability =
            total > 0 ? Math.min(totalSupply / total, 0.99) : totalSupply > 0 ? 0.99 : 0;
        }

        return {
          combo,
          supply: viewMode === "ftf" ? adjustedSupply : supply,
          demand: viewMode === "ftf" ? ftf : total,
          probability,
          unfilteredProbability,
          ftf,
          fts: demand.fts || 0,
          stf: demand.stf || 0,
          seniors: demand.seniors || 0,
        };
      })
      .sort((a, b) => b.probability - a.probability);
  }, [supplyMap, demandMap, viewMode]);

  const topCombos = useMemo(() => {
    return showAll ? comboStats : comboStats.slice(0, maxVisibleItems);
  }, [comboStats, maxVisibleItems, showAll]);

  // ---------- LOADING / EMPTY GUARD ----------
  // Avoid rendering Chart.js with empty datasets to prevent the stray "0" tick.
  // Heuristic: if BOTH inputs are empty, we're likely still loading.
  const isLoading = (!Array.isArray(data) || data.length === 0) && (!Array.isArray(demandData) || demandData.length === 0);

  // ---------- CHART DATA ----------
  const chartData = useMemo(() => {
    const colors = {
      supply: {
        bg: isDarkMode ? "rgba(100, 200, 200, 0.8)" : "rgba(54, 162, 235, 0.8)",
        border: isDarkMode ? "rgba(100, 200, 200, 1)" : "rgba(54, 162, 235, 1)",
      },
      demand: {
        bg: isDarkMode ? "rgba(255, 99, 132, 0.8)" : "rgba(255, 159, 64, 0.8)",
        border: isDarkMode ? "rgba(255, 99, 132, 1)" : "rgba(255, 159, 64, 1)",
      },
      probAny: { line: isDarkMode ? "#ab47bc" : "#9c27b0" },
      probGreat: { line: isDarkMode ? "#4caf50" : "#2e7d32" },
    };

    const datasets = [
      {
        type: "bar",
        label: "Supply",
        data: topCombos.map(({ supply }) => supply),
        backgroundColor: colors.supply.bg,
        borderColor: colors.supply.border,
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Demand",
        data: topCombos.map(({ demand }) => demand),
        backgroundColor: colors.demand.bg,
        borderColor: colors.demand.border,
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Prob. (Any Flat)",
        data: topCombos.map(({ unfilteredProbability }) => unfilteredProbability * 100),
        borderColor: colors.probAny.line,
        backgroundColor: colors.probAny.line,
        yAxisID: "y1",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors.probAny.line,
        borderDash: [5, 3],
        borderWidth: 2,
      },
      {
        type: "line",
        label: "Prob. (Great Flat)",
        data: topCombos.map(({ probability }) => probability * 100),
        borderColor: colors.probGreat.line,
        backgroundColor: colors.probGreat.line,
        yAxisID: "y1",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors.probGreat.line,
        borderWidth: 2,
      },
    ];

    return {
      labels: topCombos.map(({ combo }) => formatComboLabel(combo)),
      datasets,
    };
  }, [topCombos, isDarkMode, viewMode]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: {
        padding: {
          top: 0,
          bottom: 0,
          right: isMobile ? 5 : 10,
          left: isMobile ? 5 : 10,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? "#e2e8f0" : "#4a5568",
            font: { size: isMobile ? 10 : 12 },
            boxWidth: isMobile ? 8 : 12,
            usePointStyle: true,
            padding: isMobile ? 8 : 12,
          },
          position: "top",
          align: "center",
        },
        tooltip: {
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          titleColor: isDarkMode ? "#f8fafc" : "#1e293b",
          bodyColor: isDarkMode ? "#e2e8f0" : "#4b5563",
          borderColor: isDarkMode ? "#334155" : "#e5e7eb",
          borderWidth: 1,
          padding: isMobile ? 8 : 12,
          usePointStyle: true,
          callbacks: {
            label: (tooltipItem) => {
              const label = tooltipItem.dataset.label;
              if (label?.includes("Prob.")) {
                return `${label}: ${tooltipItem.raw?.toFixed(1)}%`;
              }
              if (label.includes("Demand"))
                return `${label}: ${tooltipItem.raw.toLocaleString()} applicants`;
              return `Supply: ${tooltipItem.raw.toLocaleString()} units`;
            },
            afterBody: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const row = topCombos[index];
              const lines = [];
              if (viewMode === "all") {
                if (row.ftf > 0) lines.push(`• First-Timer Families: ${row.ftf.toLocaleString()}`);
                if (row.fts > 0) lines.push(`• First-Timer Singles: ${row.fts.toLocaleString()}`);
                if (row.stf > 0) lines.push(`• Second-Timer Families: ${row.stf.toLocaleString()}`);
                if (row.seniors > 0) lines.push(`• Seniors: ${row.seniors.toLocaleString()}`);
              }
              return lines.length ? ["", ...lines] : [];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? "#94a3b8" : "#64748b",
            maxRotation: isMobile ? 70 : 45,
            minRotation: isMobile ? 70 : 45,
            font: { size: isMobile ? 9 : 11 },
            padding: isMobile ? 4 : 8,
          },
          grid: {
            color: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            drawOnChartArea: false,
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: !isMobile,
            text: "Units / Applicants",
            color: isDarkMode ? "#e2e8f0" : "#4a5568",
            font: { size: isMobile ? 10 : 12 },
          },
          ticks: {
            color: isDarkMode ? "#94a3b8" : "#64748b",
            font: { size: isMobile ? 9 : 11 },
            callback: (value) => {
              if (isMobile && value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              }
              return value.toLocaleString();
            },
          },
          grid: {
            color: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            drawTicks: false,
          },
        },
        y1: {
          type: "linear",
          // Hide the right axis when there's no data to avoid the stray "0"
          display: topCombos.length > 0,
          position: "right",
          title: {
            display: !isMobile,
            text: "Probability (%)",
            color: isDarkMode ? "#e2e8f0" : "#4a5568",
            font: { size: isMobile ? 10 : 12 },
          },
          ticks: {
            color: isDarkMode ? "#94a3b8" : "#64748b",
            font: { size: isMobile ? 9 : 11 },
            max: 100,
            min: 0,
            callback: (value) => `${value}%`,
            stepSize: isMobile ? 25 : 20,
          },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [isDarkMode, isMobile, topCombos, viewMode]
  );

  // ---------- PRESENTATIONAL SUBCOMPONENTS ----------
  const ViewModeToggle = () => {
    return (
      <div className={`w-full py-2 px-3 ${isDarkMode ? "bg-slate-800" : ""} mb-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Best Ballot Options{sbfCode ? ` (${sbfCode})` : ""}
          </h3>
          <div
            className="flex border rounded-lg overflow-hidden shadow-sm"
            style={{ borderColor: isDarkMode ? "#475569" : "#d1d5db" }}
          >
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                viewMode === "all"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Applicants
            </button>
            <button
              onClick={() => setViewMode("ftf")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                viewMode === "ftf"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              First-Timer Families
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChartContainer = ({ children }) => (
    <div
      className="relative"
      style={{
        height: isMobile
          ? showAll
            ? Math.max(400, topCombos.length * 40)
            : 350
          : Math.max(450, topCombos.length * 30),
        maxHeight: showAll ? 800 : 550,
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );

  const UpdatedAtLabel = () =>
    capturedAt ? (
      <div className="flex justify-end mb-2">
        <span
          className={`text-xs sm:text-sm ${isDarkMode ? "text-slate-400" : "text-gray-500"} italic`}
          title={`Data was refreshed on ${new Date(capturedAt).toLocaleString("en-SG", {
            timeZone: "Asia/Singapore",
          })}`}
        >
          Updated: {capturedAt} SGT
        </span>
      </div>
    ) : null;

  const ChartFooter = () => (
    <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"} px-2`}>
      <div className={`p-2 sm:p-3 rounded-lg ${isDarkMode ? "bg-slate-800/70" : ""} mb-3`}>
        <p className="font-medium mb-1">Not Included:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Priority schemes (FPPS, MCPS, TCPS etc.)</li>
          <li>Additional ballot chances</li>
        </ul>
      </div>
    </div>
  );

  // ---------- RENDER ----------
  if (isLoading) {
    return (
      <div className={`p-8 text-center ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (topCombos.length === 0) {
    return (
      <div className={`p-8 text-center ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
        <p className="text-lg font-medium">No units matching your current filters</p>
        <p className="mt-2">Try adjusting your selection criteria</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <ViewModeToggle />
      <div className="px-2 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <p className={`text-xs sm:text-sm mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Showing {viewMode === "ftf" ? "first-timer families" : "all applicant"} ballot
            probabilities based on your filters
          </p>

          {/* ✅ Professional updated label */}
          <UpdatedAtLabel />

          <ChartContainer>
            {/* Render the chart ONLY when we have data to avoid stray "0" */}
            {topCombos.length > 0 ? (
              <Chart type="bar" data={chartData} options={chartOptions} />
            ) : (
              <div
                className={`h-full flex items-center justify-center ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                <span className="text-sm">Loading…</span>
              </div>
            )}
          </ChartContainer>

          <ChartFooter />
        </div>
      </div>
    </div>
  );
};

export default React.memo(CountChart);

