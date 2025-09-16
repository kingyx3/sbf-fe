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
import { formatCurrency } from "../helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CompletionTimelineChart = ({ data, isDarkMode }) => {
    // Utility function to get current quarter
    const getCurrentQuarter = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() is 0-based

        let quarter;
        if (currentMonth >= 1 && currentMonth <= 3) quarter = 'Q1';
        else if (currentMonth >= 4 && currentMonth <= 6) quarter = 'Q2';
        else if (currentMonth >= 7 && currentMonth <= 9) quarter = 'Q3';
        else quarter = 'Q4';

        return `${quarter} ${currentYear}`;
    };

    // Utility function to check if a quarter is past the current quarter
    const isQuarterPast = (quarterStr) => {
        if (!quarterStr) return false;

        const currentQuarter = getCurrentQuarter();
        const [currentQ, currentYear] = currentQuarter.split(' ');
        const [quarterQ, quarterYear] = quarterStr.split(' ');

        const currentYearNum = parseInt(currentYear, 10);
        const quarterYearNum = parseInt(quarterYear, 10);

        if (quarterYearNum < currentYearNum) return true;
        if (quarterYearNum > currentYearNum) return false;

        // Same year, compare quarters
        const quarterOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
        return quarterOrder[quarterQ] < quarterOrder[currentQ];
    };

    // Utility function to parse YYYY-MM-DD dates and determine quarter
    const parseTopDateToQuarter = (dateStr) => {
        if (!dateStr || dateStr === 'Completed') return null;

        // Handle YYYY-MM-DD format
        const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10);

            // Validate month range
            if (month < 1 || month > 12) return null;

            // Determine quarter based on month
            let quarter;
            if (month >= 1 && month <= 3) quarter = 'Q1';
            else if (month >= 4 && month <= 6) quarter = 'Q2';
            else if (month >= 7 && month <= 9) quarter = 'Q3';
            else quarter = 'Q4';

            return `${quarter} ${year}`;
        }

        // Handle existing Q* YYYY formats (for backwards compatibility)
        if (dateStr.includes('Q1') || dateStr.includes('Q2') || dateStr.includes('Q3') || dateStr.includes('Q4')) {
            return dateStr;
        }

        return null; // Will be categorized as 'Other'
    };

    const timelineData = useMemo(() => {
        if (!data || data.length === 0) return { categories: [], stats: {} };

        // First pass: collect all unique quarters from the data, excluding overdue ones
        const uniqueQuarters = new Set();
        let hasCompleted = false;
        let hasOverdue = false;

        data.forEach(flat => {
            const topDate = flat.top_date || flat.top_delay_date;
            if (topDate === 'Completed') {
                hasCompleted = true;
            } else {
                const quarter = parseTopDateToQuarter(topDate);
                if (quarter) {
                    // Check if this quarter is overdue
                    if (isQuarterPast(quarter)) {
                        hasOverdue = true; // Mark that we have overdue units (will add to Completed)
                    } else {
                        uniqueQuarters.add(quarter); // Only add future quarters
                    }
                } else {
                    uniqueQuarters.add('Other');
                }
            }
        });

        // Dynamically create completion categories based on found quarters
        const completionCategories = {};

        // Always include 'Completed' if we have completed units OR overdue units
        if (hasCompleted || hasOverdue) {
            completionCategories['Completed'] = {
                label: 'Ready to Move In',
                units: [],
                color: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)"
            };
        }

        // Sort quarters chronologically and add only future quarters
        const sortedQuarters = Array.from(uniqueQuarters)
            .filter(q => q !== 'Other')
            .sort((a, b) => {
                // Parse quarter strings like "Q1 2025", "Q4 2027"
                const [quarterA, yearA] = a.split(' ');
                const [quarterB, yearB] = b.split(' ');

                if (yearA !== yearB) return parseInt(yearA, 10) - parseInt(yearB, 10);
                return quarterA.localeCompare(quarterB);
            });

        // Define colors for quarters (only for future quarters now)
        const quarterColors = [
            { dark: "rgba(59, 130, 246, 0.8)", light: "rgba(37, 99, 235, 0.8)" },    // Blue
            { dark: "rgba(168, 85, 247, 0.8)", light: "rgba(147, 51, 234, 0.8)" },   // Purple
            { dark: "rgba(245, 158, 11, 0.8)", light: "rgba(217, 119, 6, 0.8)" },    // Yellow
            { dark: "rgba(249, 115, 22, 0.8)", light: "rgba(234, 88, 12, 0.8)" },    // Orange
            { dark: "rgba(236, 72, 153, 0.8)", light: "rgba(219, 39, 119, 0.8)" },   // Pink
            { dark: "rgba(14, 165, 233, 0.8)", light: "rgba(2, 132, 199, 0.8)" },    // Sky Blue
            { dark: "rgba(34, 197, 94, 0.8)", light: "rgba(22, 163, 74, 0.8)" },     // Green
            { dark: "rgba(239, 68, 68, 0.8)", light: "rgba(220, 38, 38, 0.8)" }      // Red
        ];

        // Add future quarters only (overdue quarters will be moved to "Ready to Move In")
        sortedQuarters.forEach((quarter, index) => {
            const colorIndex = index % quarterColors.length;
            const colors = quarterColors[colorIndex];

            completionCategories[quarter] = {
                label: quarter,
                units: [],
                color: isDarkMode ? colors.dark : colors.light,
                isPast: false
            };
        });

        // Always include 'Other' if it exists
        if (uniqueQuarters.has('Other')) {
            completionCategories['Other'] = {
                label: 'Future/Other',
                units: [],
                color: isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)"
            };
        }

        // Categorize each unit using the dynamic categories
        data.forEach(flat => {
            const topDate = flat.top_date || flat.top_delay_date || 'Other';

            if (topDate === 'Completed') {
                if (completionCategories['Completed']) {
                    completionCategories['Completed'].units.push(flat);
                }
            } else {
                const quarter = parseTopDateToQuarter(topDate);
                if (quarter) {
                    // Check if quarter is overdue - if so, add to "Ready to Move In"
                    if (isQuarterPast(quarter)) {
                        if (completionCategories['Completed']) {
                            completionCategories['Completed'].units.push(flat);
                        }
                    } else if (completionCategories[quarter]) {
                        // Future quarter - add to its category
                        completionCategories[quarter].units.push(flat);
                    }
                } else if (completionCategories['Other']) {
                    completionCategories['Other'].units.push(flat);
                }
            }
        });

        // Calculate statistics for each category
        const categories = Object.entries(completionCategories).map(([key, category]) => {
            const units = category.units;
            const avgPrice = units.length > 0
                ? Math.round(units.reduce((sum, unit) => sum + unit.price, 0) / units.length)
                : 0;
            const minPrice = units.length > 0
                ? Math.round(Math.min(...units.map(unit => unit.price)))
                : 0;
            const maxPrice = units.length > 0
                ? Math.round(Math.max(...units.map(unit => unit.price)))
                : 0;

            // Group by flat type
            const flatTypeBreakdown = {};
            units.forEach(unit => {
                if (!flatTypeBreakdown[unit.flat_type]) {
                    flatTypeBreakdown[unit.flat_type] = 0;
                }
                flatTypeBreakdown[unit.flat_type]++;
            });

            // Group by town
            const townBreakdown = {};
            units.forEach(unit => {
                if (!townBreakdown[unit.project_town]) {
                    townBreakdown[unit.project_town] = 0;
                }
                townBreakdown[unit.project_town]++;
            });

            return {
                key,
                label: category.label,
                color: category.color,
                count: units.length,
                avgPrice,
                minPrice,
                maxPrice,
                flatTypeBreakdown,
                townBreakdown,
                sampleUnits: units.slice(0, 3), // Sample units for tooltip
                isPast: category.isPast || false
            };
        }).filter(category => category.count > 0);

        const totalUnits = data.length;
        const completedUnits = completionCategories['Completed'] ? completionCategories['Completed'].units.length : 0;
        const upcomingUnits = totalUnits - completedUnits;

        // Find peak quarter excluding "Ready to Move In" units
        const peakQuarter = categories
            .filter(cat => cat.key !== 'Completed' && cat.key !== 'Other')
            .reduce((max, cat) => cat.count > max.count ? cat : max, { count: 0, label: 'N/A' });



        return {
            categories,
            stats: {
                totalUnits,
                completedUnits,
                upcomingUnits,
                completedPercentage: (completedUnits / totalUnits) * 100,
                peakQuarter: peakQuarter.label
            }
        };
    }, [data, isDarkMode]);

    const hasData = timelineData.categories.length > 0;

    if (!hasData) {
        return (
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Completion Timeline Analysis
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No completion timeline data available
                </p>
            </div>
        );
    }

    const chartData = {
        labels: timelineData.categories.map(cat => cat.label),
        datasets: [
            {
                label: "Number of Units",
                data: timelineData.categories.map(cat => cat.count),
                backgroundColor: timelineData.categories.map(cat => cat.color),
                borderColor: timelineData.categories.map(cat => cat.color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDarkMode ? '#fff' : '#000',
                bodyColor: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#555' : '#ccc',
                borderWidth: 1,
                callbacks: {
                    title: (tooltipItems) => {
                        const category = timelineData.categories[tooltipItems[0].dataIndex];
                        return `Completion: ${category.label}`;
                    },
                    label: (tooltipItem) => {
                        const category = timelineData.categories[tooltipItem.dataIndex];
                        const percentage = ((category.count / timelineData.stats.totalUnits) * 100).toFixed(1);

                        const topFlatTypes = Object.entries(category.flatTypeBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([type, count]) => `${type}: ${count}`)
                            .join(', ');

                        return [
                            `Units: ${category.count} (${percentage}%)`,
                            `Avg Price: ${formatCurrency(category.avgPrice)}`,
                            `Range: ${formatCurrency(category.minPrice)} - ${formatCurrency(category.maxPrice)}`,
                            `Top Types: ${topFlatTypes}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Expected Completion Timeline',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    maxRotation: 45,
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Units',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    stepSize: (() => {
                        const maxValue = Math.max(...timelineData.categories.map(cat => cat.count));
                        if (maxValue <= 10) return 1;        // Very small datasets: 1, 2, 3, 4...
                        if (maxValue <= 25) return 5;        // Small datasets: 5, 10, 15, 20, 25...
                        if (maxValue <= 50) return 10;       // Small-medium datasets: 10, 20, 30, 40, 50...
                        if (maxValue <= 100) return 25;      // Medium datasets: 25, 50, 75, 100...
                        if (maxValue <= 250) return 50;      // Medium datasets: 50, 100, 150, 200, 250...
                        if (maxValue <= 500) return 100;     // Medium-large datasets: 100, 200, 300, 400, 500...
                        if (maxValue <= 1000) return 200;    // Large datasets: 200, 400, 600, 800, 1000...
                        if (maxValue <= 2500) return 500;    // Large datasets: 500, 1000, 1500, 2000, 2500...
                        return 100; // Default to 100 for backward compatibility
                    })(),
                },
                grid: {
                    color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                },
            },
        },
    };

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Completion Timeline Analysis
                </h3>
                <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {timelineData.stats.totalUnits} units total
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Ready Now
                    </p>
                    <p className="text-lg font-bold text-green-500">
                        {timelineData.stats.completedUnits} units ({timelineData.stats.completedPercentage.toFixed(1)}%)
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Coming Soon
                    </p>
                    <p className="text-lg font-bold text-blue-500">
                        {timelineData.stats.upcomingUnits} units ({(100 - timelineData.stats.completedPercentage).toFixed(1)}%)
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Peak Quarter
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {timelineData.stats.peakQuarter}
                    </p>
                </div>
            </div>

            <div style={{ height: "400px" }} className="mb-6">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default CompletionTimelineChart;