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

const LocationValueChart = ({ data, isDarkMode }) => {
    const locationData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        return data
            .filter(flat => flat.walking_time_in_mins !== undefined && flat.price && flat.nearest_mrt)
            .map(flat => {
                return {
                    x: flat.walking_time_in_mins,
                    y: flat.price,
                    block: flat.block,
                    unit: flat.unit,
                    project: flat.project_name,
                    town: flat.project_town,
                    flatType: flat.flat_type,
                    mrt: flat.nearest_mrt,
                };
            });
    }, [data]);

    const hasData = locationData.length > 0;

    if (!hasData) {
        return (
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Location Value Analysis
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No walking time data available for location analysis
                </p>
            </div>
        );
    }

    // Color coding based on location score and flat type
    const getPointColor = (point) => {
        const flatTypeColors = {
            "2-room": isDarkMode ? "rgba(168, 85, 247, 0.8)" : "rgba(147, 51, 234, 0.8)", // Purple
            "2-room Flexi": isDarkMode ? "rgba(196, 125, 255, 0.8)" : "rgba(168, 85, 247, 0.8)", // Light Purple
            "3-room": isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)",   // Green  
            "4-room": isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)",  // Blue
            "5-room": isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)",  // Orange
            "Executive": isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)", // Red
            "3Gen": isDarkMode ? "rgba(147, 51, 234, 0.8)" : "rgba(124, 58, 237, 0.8)", // Purple shade (consistent with FlatMap.js)
            "Community Care Apartment": isDarkMode ? "rgba(20, 184, 166, 0.8)" : "rgba(13, 148, 136, 0.8)", // Teal
        };
        return flatTypeColors[point.flatType] || isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)";
    };

    const getPointSize = () => {
        // Uniform small size for better visibility and reduced visual clutter
        return 3;
    };

    // Group data by flat type for separate datasets
    const flatTypes = [...new Set(locationData.map(point => point.flatType))];
    
    const datasets = flatTypes.map(flatType => {
        const typeData = locationData.filter(point => point.flatType === flatType);
        
        // Direct color mapping for legend display
        const flatTypeColors = {
            "2-room": isDarkMode ? "rgba(168, 85, 247, 0.8)" : "rgba(147, 51, 234, 0.8)", // Purple
            "2-room Flexi": isDarkMode ? "rgba(196, 125, 255, 0.8)" : "rgba(168, 85, 247, 0.8)", // Light Purple
            "3-room": isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)",   // Green  
            "4-room": isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)",  // Blue
            "5-room": isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)",  // Orange
            "Executive": isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)", // Red
            "3Gen": isDarkMode ? "rgba(147, 51, 234, 0.8)" : "rgba(124, 58, 237, 0.8)", // Purple shade (consistent with FlatMap.js)
            "Community Care Apartment": isDarkMode ? "rgba(20, 184, 166, 0.8)" : "rgba(13, 148, 136, 0.8)", // Teal
        };
        const flatTypeColor = flatTypeColors[flatType] || (isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)");
        
        return {
            label: flatType,
            data: typeData,
            backgroundColor: flatTypeColor, // Single color for legend display
            borderColor: flatTypeColor, // Single color for legend display
            pointRadius: typeData.map(() => getPointSize()),
            pointHoverRadius: typeData.map(() => getPointSize() + 1),
        };
    });

    const chartData = { datasets };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: isDarkMode ? "#fff" : "#000",
                    boxWidth: 12,
                    padding: 15,
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
                        const point = tooltipItems[0].raw;
                        return `${point.project} - ${point.flatType}`;
                    },
                    label: (tooltipItem) => {
                        const point = tooltipItem.raw;
                        return [
                            `Block ${point.block} • ${point.unit}`,
                            `Price: ${formatCurrency(point.y)}`,
                            `Walk to MRT: ${point.x} mins`,
                            `MRT Station: ${point.mrt}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Walking Time to MRT (minutes)',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    callback: (value) => `${value} min`,
                },
                grid: {
                    color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'SBF Price (SGD)',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    callback: (value) => formatCurrencyShort(value),
                },
                grid: {
                    color: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                },
            },
        },
    };

    // Calculate summary statistics
    const avgWalkTime = locationData.reduce((sum, point) => sum + point.x, 0) / locationData.length;
    const under5MinUnits = locationData.filter(point => point.x <= 5).length;
    const over15MinUnits = locationData.filter(point => point.x > 15).length;

    // Find best value units (low walking time, reasonable price)
    const bestValueUnits = locationData
        .filter(point => point.x <= 10) // Within 10 mins walk
        .sort((a, b) => a.y - b.y) // Sort by price ascending
        .slice(0, 3);

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Location Value Analysis - MRT Accessibility
                </h3>
                <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {locationData.length} units analyzed
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Avg Walk Time
                    </p>
                    <p className={`text-lg font-bold ${avgWalkTime <= 10 ? "text-green-500" : avgWalkTime <= 15 ? "text-yellow-500" : "text-red-500"}`}>
                        {avgWalkTime.toFixed(1)} mins
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Excellent Access
                    </p>
                    <p className="text-lg font-bold text-green-500">
                        {under5MinUnits} units (≤5 min)
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Far from MRT
                    </p>
                    <p className="text-lg font-bold text-red-500">
                        {over15MinUnits} units (>15 min)
                    </p>
                </div>
            </div>

            <div style={{ height: "400px" }}>
                <Scatter data={chartData} options={chartOptions} />
            </div>

            {/* Best Value Recommendations */}
            {bestValueUnits.length > 0 && (
                <div className="mt-6">
                    <h4 className={`text-md font-semibold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>
                        🎯 Best Value Units (Good Location + Competitive Price)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {bestValueUnits.map((unit, index) => (
                            <div key={index} className={`p-3 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                                <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {unit.project} - {unit.flatType}
                                </p>
                                <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    Block {unit.block} • {unit.unit}
                                </p>
                                <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {formatCurrency(unit.y)} • {unit.x} min walk
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationValueChart;