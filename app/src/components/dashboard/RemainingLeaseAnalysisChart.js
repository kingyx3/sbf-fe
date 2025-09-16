import { useMemo, useCallback } from "react";
import { Chart } from "react-chartjs-2";
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
import { formatCurrencyShort } from "../helpers";

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

const RemainingLeaseAnalysisChart = ({ data, isDarkMode }) => {
    // Utility functions for completion status (extracted from CompletionTimelineChart)
    const getCurrentQuarter = useCallback(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let quarter;
        if (currentMonth >= 1 && currentMonth <= 3) quarter = 'Q1';
        else if (currentMonth >= 4 && currentMonth <= 6) quarter = 'Q2';
        else if (currentMonth >= 7 && currentMonth <= 9) quarter = 'Q3';
        else quarter = 'Q4';

        return `${quarter} ${currentYear}`;
    }, []);

    const isQuarterPast = useCallback((quarterStr) => {
        if (!quarterStr) return false;

        const currentQuarter = getCurrentQuarter();
        const [currentQ, currentYear] = currentQuarter.split(' ');
        const [quarterQ, quarterYear] = quarterStr.split(' ');

        const currentYearNum = parseInt(currentYear, 10);
        const quarterYearNum = parseInt(quarterYear, 10);

        if (quarterYearNum < currentYearNum) return true;
        if (quarterYearNum > currentYearNum) return false;

        const quarterOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
        return quarterOrder[quarterQ] < quarterOrder[currentQ];
    }, [getCurrentQuarter]);

    const parseTopDateToQuarter = useCallback((dateStr) => {
        if (!dateStr || dateStr === 'Completed') return null;

        const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10);

            if (month < 1 || month > 12) return null;

            let quarter;
            if (month >= 1 && month <= 3) quarter = 'Q1';
            else if (month >= 4 && month <= 6) quarter = 'Q2';
            else if (month >= 7 && month <= 9) quarter = 'Q3';
            else quarter = 'Q4';

            return `${quarter} ${year}`;
        }

        if (dateStr.includes('Q1') || dateStr.includes('Q2') || dateStr.includes('Q3') || dateStr.includes('Q4')) {
            return dateStr;
        }

        return null;
    }, []);

    const isUnitCompleted = useCallback((flat) => {
        const topDate = flat.top_date || flat.top_delay_date;
        if (topDate === 'Completed') return true;
        
        const quarter = parseTopDateToQuarter(topDate);
        if (quarter && isQuarterPast(quarter)) return true;
        
        return false;
    }, [isQuarterPast, parseTopDateToQuarter]);

    const leaseAnalysisData = useMemo(() => {
        if (!data || data.length === 0) return { buckets: [], stats: {} };
        
        // Define lease ranges with completion status splitting for 98-99 years
        const leaseRanges = [
            { min: 98, max: 99, label: "99 years (Future)", color: isDarkMode ? "rgba(168, 85, 247, 0.8)" : "rgba(139, 69, 219, 0.8)", requiresCompleted: false },
            { min: 98, max: 99, label: "98-99 years (Ready)", color: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)", requiresCompleted: true },
            { min: 95, max: 97, label: "95-97 years", color: isDarkMode ? "rgba(6, 182, 212, 0.8)" : "rgba(8, 145, 178, 0.8)" },
            { min: 85, max: 94, label: "85-94 years", color: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)" },
            { min: 75, max: 84, label: "75-84 years", color: isDarkMode ? "rgba(250, 204, 21, 0.8)" : "rgba(234, 179, 8, 0.8)" },
            { min: 50, max: 74, label: "50-74 years", color: isDarkMode ? "rgba(249, 115, 22, 0.8)" : "rgba(234, 88, 12, 0.8)" },
            { min: 0, max: 49, label: "Under 50 years", color: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)" }
        ];

        // Group flats by lease ranges
        const buckets = leaseRanges.map(range => {
            const unitsInRange = data.filter(flat => {
                const lease = Number(flat.max_lease) || 0;
                if (lease < range.min || lease > range.max) return false;
                
                // For 98-99 year ranges, filter by completion status
                if (Object.prototype.hasOwnProperty.call(range, 'requiresCompleted')) {
                    const completed = isUnitCompleted(flat);
                    return range.requiresCompleted ? completed : !completed;
                }
                
                return true;
            });
            
            // Group by flat type within each lease range (kept for potential future use)
            const flatTypeBreakdown = {};
            unitsInRange.forEach(flat => {
                if (!flatTypeBreakdown[flat.flat_type]) {
                    flatTypeBreakdown[flat.flat_type] = [];
                }
                flatTypeBreakdown[flat.flat_type].push(flat);
            });

            // --- CHANGED METRIC: compute $ per remaining year ---
            const pricePerYearList = unitsInRange
                .map(flat => {
                    const price = Number(flat.price) || 0;
                    const lease = Number(flat.max_lease) || 0;
                    if (price > 0 && lease > 0) return price / lease;
                    return null;
                })
                .filter(v => v != null);

            const avgPrice = pricePerYearList.length > 0
                ? pricePerYearList.reduce((sum, v) => sum + v, 0) / pricePerYearList.length
                : 0;
            const minPrice = pricePerYearList.length > 0 ? Math.min(...pricePerYearList) : 0;
            const maxPrice = pricePerYearList.length > 0 ? Math.max(...pricePerYearList) : 0;

            return {
                ...range,
                totalUnits: unitsInRange.length,
                flatTypeBreakdown,
                // Note: we reuse avgPrice/minPrice/maxPrice fields to keep downstream changes minimal.
                // They now represent $ per year remaining.
                avgPrice,
                minPrice,
                maxPrice,
                avgLease: unitsInRange.length > 0 
                    ? unitsInRange.reduce((sum, flat) => sum + (Number(flat.max_lease) || 0), 0) / unitsInRange.length 
                    : 0
            };
        }).filter(bucket => bucket.totalUnits > 0); // Only include ranges with units

        // Calculate overall statistics (price per remaining year)
        const totalUnits = data.length;
        const pricePerYearValues = data
            .map(flat => {
                const price = Number(flat.price) || 0;
                const lease = Number(flat.max_lease) || 0;
                if (price > 0 && lease > 0) return price / lease;
                return null;
            })
            .filter(v => v != null);

        const avgPricePerYear = pricePerYearValues.length > 0
            ? pricePerYearValues.reduce((sum, v) => sum + v, 0) / pricePerYearValues.length
            : 0;
        const minPricePerYear = pricePerYearValues.length > 0 ? Math.min(...pricePerYearValues) : 0;
        const maxPricePerYear = pricePerYearValues.length > 0 ? Math.max(...pricePerYearValues) : 0;

        const stats = {
            totalUnits,
            avgPricePerYear,
            minPricePerYear,
            maxPricePerYear,
        };

        return { buckets, stats };
    }, [data, isDarkMode, isUnitCompleted]);

    // Prepare chart data for combined units and $ per year visualization
    const chartData = useMemo(() => {
        if (!leaseAnalysisData.buckets || leaseAnalysisData.buckets.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = leaseAnalysisData.buckets.map(bucket => bucket.label);
        const unitCounts = leaseAnalysisData.buckets.map(bucket => bucket.totalUnits);
        const avgPerYear = leaseAnalysisData.buckets.map(bucket => bucket.avgPrice); // now $/yr
        const colors = leaseAnalysisData.buckets.map(bucket => bucket.color);

        return {
            labels,
            datasets: [
                {
                    type: "bar",
                    label: "Number of Units",
                    data: unitCounts,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    type: "line",
                    label: "Avg $ / Year Remaining",
                    data: avgPerYear,
                    backgroundColor: isDarkMode ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)',
                    borderColor: isDarkMode ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: isDarkMode ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)',
                }
            ],
        };
    }, [leaseAnalysisData.buckets, isDarkMode]);

    // Chart options with dual y-axes
    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
                position: 'top',
                labels: {
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12 },
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
                        const bucket = leaseAnalysisData.buckets[tooltipItems[0].dataIndex];
                        return `Lease Range: ${bucket.label}`;
                    },
                    label: (tooltipItem) => {
                        const bucket = leaseAnalysisData.buckets[tooltipItem.dataIndex];
                        const percentage = ((bucket.totalUnits / leaseAnalysisData.stats.totalUnits) * 100).toFixed(1);
                        
                        if (tooltipItem.datasetIndex === 0) {
                            return [
                                `Units: ${bucket.totalUnits} (${percentage}%)`,
                                `Avg Lease: ${Math.round(bucket.avgLease)} years`,
                            ];
                        } else {
                            // Note: avgPrice/minPrice/maxPrice now represent $ per year remaining.
                            return [
                                `Avg $/yr: ${formatCurrencyShort(bucket.avgPrice)} /yr`,
                                `Range: ${formatCurrencyShort(bucket.minPrice)} - ${formatCurrencyShort(bucket.maxPrice)} /yr`,
                            ];
                        }
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Remaining Lease Years',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 11 },
                },
                grid: {
                    display: false,
                },
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Number of Units',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 11 },
                    beginAtZero: true,
                },
                grid: {
                    color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Avg $ per year lease (SGD/yr)',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 11 },
                    beginAtZero: true,
                    callback: (value) => {
                        if (value >= 1000000) {
                            return `$${(value / 1000000).toFixed(1)}M/yr`;
                        } else if (value >= 1000) {
                            return `$${(value / 1000).toFixed(1)}k/yr`;
                        }
                        return `$${Math.round(value)}/yr`;
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    }), [leaseAnalysisData.buckets, leaseAnalysisData.stats.totalUnits, isDarkMode]);

    const hasData = leaseAnalysisData.buckets.length > 0;

    if (!hasData) {
        return (
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Remaining Lease Analysis
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No data available for lease analysis
                </p>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    🏠 Remaining Lease Analysis
                </h3>
                <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {leaseAnalysisData.stats.totalUnits} units total
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Avg $/yr
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatCurrencyShort(leaseAnalysisData.stats.avgPricePerYear)} /yr
                    </p>
                </div>

                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Highest $/yr
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatCurrencyShort(leaseAnalysisData.stats.maxPricePerYear)} /yr
                    </p>
                </div>

                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Lowest $/yr
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatCurrencyShort(leaseAnalysisData.stats.minPricePerYear)} /yr
                    </p>
                </div>
            </div>

            {/* Chart Visualization */}
            <div style={{ height: "400px" }} className="mb-6">
                <Chart data={chartData} options={chartOptions} />
            </div>

            {/* Investment Insights */}
            {/* <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-blue-900/20" : "bg-blue-50"} border-l-4 ${isDarkMode ? "border-blue-400" : "border-blue-500"}`}>
                <h4 className={`text-sm font-semibold ${isDarkMode ? "text-blue-300" : "text-blue-800"} mb-2`}>
                    💡 Lease Considerations for Buyers
                </h4>
                <ul className={`text-xs ${isDarkMode ? "text-blue-200" : "text-blue-700"} space-y-1`}>
                    <li>• Units with 60+ years lease typically have better loan eligibility</li>
                    <li>• Shorter lease units may offer better value but limited financing options</li>
                    <li>• Consider resale potential - longer leases generally maintain value better</li>
                    <li>• Banks typically require minimum 30 years remaining lease for loans</li>
                </ul>
            </div> */}
        </div>
    );
};

export default RemainingLeaseAnalysisChart;
