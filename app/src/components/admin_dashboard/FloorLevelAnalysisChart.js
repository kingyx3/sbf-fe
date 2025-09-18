import { useMemo } from "react";
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

const FloorLevelAnalysisChart = ({ data, isDarkMode }) => {
    const floorData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        return data
            .filter(flat => flat.level !== undefined && flat.price && flat.flat_type)
            .map(flat => {
                const roiPercentage = flat.approximate_resale_value && flat.price
                    ? ((flat.approximate_resale_value - flat.price) / flat.price) * 100
                    : null;
                
                return {
                    x: flat.level,
                    y: flat.price,
                    block: flat.block,
                    unit: flat.unit,
                    project: flat.project_name,
                    town: flat.project_town,
                    flatType: flat.flat_type,
                    resaleValue: flat.approximate_resale_value,
                    roi: roiPercentage,
                    size: flat.size_sqm,
                    pricePsf: flat.price_psf,
                };
            });
    }, [data]);

    const hasData = floorData.length > 0;

    if (!hasData) {
        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🏢</span>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                        Floor Level Analysis
                    </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No floor level data available for analysis
                </p>
            </div>
        );
    }

    // Calculate insights
    const avgPrice = floorData.reduce((sum, p) => sum + p.y, 0) / floorData.length;
    const minLevel = Math.min(...floorData.map(p => p.x));
    const maxLevel = Math.max(...floorData.map(p => p.x));
    
    // Dynamic floor categorization based on building-specific context
    // Group by project/block to understand the max floors per building
    const buildingGroups = floorData.reduce((acc, flat) => {
        const key = `${flat.project}_${flat.block}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(flat);
        return acc;
    }, {});

    // Calculate dynamic floor categories for each building
    const floorDataWithCategories = floorData.map(flat => {
        const buildingKey = `${flat.project}_${flat.block}`;
        const buildingFloors = buildingGroups[buildingKey];
        const buildingMaxLevel = Math.max(...buildingFloors.map(f => f.x));
        const buildingMinLevel = Math.min(...buildingFloors.map(f => f.x));
        
        // Dynamic categorization based on building's floor range
        let category;
        if (buildingMaxLevel <= 10) {
            // Low-rise building (≤10 floors)
            if (flat.x <= Math.ceil(buildingMaxLevel * 0.33)) {
                category = 'low';
            } else if (flat.x <= Math.ceil(buildingMaxLevel * 0.67)) {
                category = 'mid';
            } else {
                category = 'high';
            }
        } else if (buildingMaxLevel <= 20) {
            // Mid-rise building (11-20 floors)
            if (flat.x <= Math.ceil(buildingMaxLevel * 0.30)) {
                category = 'low';
            } else if (flat.x <= Math.ceil(buildingMaxLevel * 0.70)) {
                category = 'mid';
            } else {
                category = 'high';
            }
        } else {
            // High-rise building (>20 floors)
            if (flat.x <= Math.ceil(buildingMaxLevel * 0.25)) {
                category = 'low';
            } else if (flat.x <= Math.ceil(buildingMaxLevel * 0.75)) {
                category = 'mid';
            } else {
                category = 'high';
            }
        }
        
        return {
            ...flat,
            category,
            buildingMaxLevel,
            buildingType: buildingMaxLevel <= 10 ? 'Low-rise' : buildingMaxLevel <= 20 ? 'Mid-rise' : 'High-rise'
        };
    });

    // Group by dynamic categories
    const lowFloors = floorDataWithCategories.filter(p => p.category === 'low');
    const midFloors = floorDataWithCategories.filter(p => p.category === 'mid');
    const highFloors = floorDataWithCategories.filter(p => p.category === 'high');

    const avgPriceLow = lowFloors.length > 0 ? lowFloors.reduce((sum, p) => sum + p.y, 0) / lowFloors.length : 0;
    const avgPriceMid = midFloors.length > 0 ? midFloors.reduce((sum, p) => sum + p.y, 0) / midFloors.length : 0;
    const avgPriceHigh = highFloors.length > 0 ? highFloors.reduce((sum, p) => sum + p.y, 0) / highFloors.length : 0;

    // ROI analysis by dynamic floor categories
    const roiData = floorDataWithCategories.filter(p => p.roi !== null);
    const avgROILow = lowFloors.filter(p => p.roi !== null).length > 0 
        ? lowFloors.filter(p => p.roi !== null).reduce((sum, p) => sum + p.roi, 0) / lowFloors.filter(p => p.roi !== null).length 
        : 0;
    const avgROIMid = midFloors.filter(p => p.roi !== null).length > 0 
        ? midFloors.filter(p => p.roi !== null).reduce((sum, p) => sum + p.roi, 0) / midFloors.filter(p => p.roi !== null).length 
        : 0;
    const avgROIHigh = highFloors.filter(p => p.roi !== null).length > 0 
        ? highFloors.filter(p => p.roi !== null).reduce((sum, p) => sum + p.roi, 0) / highFloors.filter(p => p.roi !== null).length 
        : 0;

    // Building type distribution for insights
    const buildingTypes = [...new Set(floorDataWithCategories.map(f => f.buildingType))];
    const buildingTypeStats = buildingTypes.map(type => {
        const typeFloors = floorDataWithCategories.filter(f => f.buildingType === type);
        return {
            type,
            count: typeFloors.length,
            avgMaxLevel: typeFloors.reduce((sum, f) => sum + f.buildingMaxLevel, 0) / typeFloors.length
        };
    });

    // Group data by flat type for different colors (using enhanced data with building context)
    const flatTypes = [...new Set(floorDataWithCategories.map(item => item.flatType))];
    const datasets = flatTypes.map(flatType => {
        const typeData = floorDataWithCategories.filter(item => item.flatType === flatType);
        
        // Color mapping for flat types (consistent with other charts)
        const flatTypeColors = {
            "1-room": isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(22, 163, 74, 0.8)",   // Green
            "2-room": isDarkMode ? "rgba(168, 85, 247, 0.8)" : "rgba(147, 51, 234, 0.8)", // Purple  
            "2-room Flexi": isDarkMode ? "rgba(168, 85, 247, 0.6)" : "rgba(147, 51, 234, 0.6)", // Purple lighter
            "3-room": isDarkMode ? "rgba(236, 72, 153, 0.8)" : "rgba(219, 39, 119, 0.8)", // Pink
            "4-room": isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)",  // Blue
            "5-room": isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)",  // Orange
            "Executive": isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)", // Red
            "3Gen": isDarkMode ? "rgba(147, 51, 234, 0.8)" : "rgba(124, 58, 237, 0.8)", // Purple shade
            "Community Care Apartment": isDarkMode ? "rgba(20, 184, 166, 0.8)" : "rgba(13, 148, 136, 0.8)", // Teal
        };
        const flatTypeColor = flatTypeColors[flatType] || (isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)");
        
        return {
            label: flatType,
            data: typeData,
            backgroundColor: flatTypeColor,
            borderColor: flatTypeColor,
            pointRadius: 4,
            pointHoverRadius: 6,
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
                        const labels = [
                            `Block ${point.block} • ${point.unit}`,
                            `Floor Level: ${point.x} (${point.category} for this building)`,
                            `Building Type: ${point.buildingType} (${point.buildingMaxLevel} floors max)`,
                            `Price: ${formatCurrency(point.y)}`,
                        ];
                        
                        if (point.pricePsf) {
                            labels.push(`Price PSF: $${point.pricePsf}`);
                        }
                        
                        if (point.resaleValue) {
                            labels.push(`Est. Resale: ${formatCurrency(point.resaleValue)}`);
                        }
                        
                        if (point.roi !== null) {
                            labels.push(`ROI: ${point.roi.toFixed(1)}%`);
                        }
                        
                        return labels;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Floor Level',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    stepSize: 1,
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

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏢</span>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Floor Level Analysis
                </h3>
            </div>
            <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                How floor level affects SBF price and potential resale value across different flat types. Analysis adapts to building heights - floor categories are relative to each building's maximum height.
            </p>

            {/* Building Type Distribution */}
            <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-slate-800" : "bg-blue-50"}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🏗️ Building Type Distribution
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {buildingTypeStats.map(stat => (
                        <div key={stat.type} className="text-center">
                            <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {stat.type}
                            </div>
                            <div className="text-lg font-bold text-blue-500">
                                {stat.count} units
                            </div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Avg max: {stat.avgMaxLevel.toFixed(1)} floors
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Low Floors (Relative)
                    </h4>
                    <p className="text-lg font-bold text-blue-500">
                        {formatCurrency(avgPriceLow)}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Avg Price • {lowFloors.length} units
                    </p>
                    {avgROILow > 0 && (
                        <p className={`text-xs mt-1 ${avgROILow >= 30 ? "text-green-500" : avgROILow >= 10 ? "text-yellow-500" : "text-red-500"}`}>
                            {avgROILow.toFixed(1)}% avg ROI
                        </p>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Bottom 25-33% of building height
                    </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Mid Floors (Relative)
                    </h4>
                    <p className="text-lg font-bold text-green-500">
                        {formatCurrency(avgPriceMid)}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Avg Price • {midFloors.length} units
                    </p>
                    {avgROIMid > 0 && (
                        <p className={`text-xs mt-1 ${avgROIMid >= 30 ? "text-green-500" : avgROIMid >= 10 ? "text-yellow-500" : "text-red-500"}`}>
                            {avgROIMid.toFixed(1)}% avg ROI
                        </p>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Middle 30-45% of building height
                    </p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        High Floors (Relative)
                    </h4>
                    <p className="text-lg font-bold text-orange-500">
                        {formatCurrency(avgPriceHigh)}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Avg Price • {highFloors.length} units
                    </p>
                    {avgROIHigh > 0 && (
                        <p className={`text-xs mt-1 ${avgROIHigh >= 30 ? "text-green-500" : avgROIHigh >= 10 ? "text-yellow-500" : "text-red-500"}`}>
                            {avgROIHigh.toFixed(1)}% avg ROI
                        </p>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Top 25-30% of building height
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div style={{ height: "400px" }}>
                <Scatter data={chartData} options={chartOptions} />
            </div>

            {/* Insights */}
            <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-blue-50"}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    💡 Key Insights (Building-Adaptive Analysis)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        • Floor range: Level {minLevel} to {maxLevel} across all buildings
                    </div>
                    <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        • Average price: {formatCurrency(avgPrice)}
                    </div>
                    <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        • Building types: {buildingTypeStats.map(s => s.type).join(', ')}
                    </div>
                    {avgPriceMid > avgPriceLow && (
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                            • Mid floors cost {(((avgPriceMid - avgPriceLow) / avgPriceLow) * 100).toFixed(1)}% more than low floors (relative)
                        </div>
                    )}
                    {avgPriceHigh > avgPriceMid && (
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                            • High floors cost {(((avgPriceHigh - avgPriceMid) / avgPriceMid) * 100).toFixed(1)}% more than mid floors (relative)
                        </div>
                    )}
                    <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        • Analysis adapts floor categories to each building's maximum height
                    </div>
                    {roiData.length > 0 && (
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                            • {roiData.length} units have resale value data
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FloorLevelAnalysisChart;