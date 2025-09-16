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
import { flatTypes } from "../../config/static";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Singapore HDB Mortgage Calculator Parameters
// These parameters follow standard HDB financing guidelines for SBF units
const SINGAPORE_HDB_MORTGAGE_PARAMS = {
    // Income-to-payment ratio: 30% of gross monthly household income
    // Reference: HDB guidelines allow up to 30% of income for mortgage servicing
    INCOME_TO_PAYMENT_RATIO: 0.30,
    
    // Interest rate: 2.6% annual (as of 2024)
    // Reference: HDB loan rates have been around 2.6% in recent years
    // This rate is competitive with commercial bank rates for HDB loans
    ANNUAL_INTEREST_RATE: 0.026,
    
    // Loan tenure: 25 years maximum
    // Reference: HDB allows up to 25 years for resale flats, subject to remaining lease
    LOAN_TENURE_YEARS: 25,
    
    // Down payment: 20% of purchase price
    // Reference: HDB requires minimum 5% cash + up to 15% CPF = 20% total down payment
    DOWN_PAYMENT_RATIO: 0.20
};

/**
 * Calculate minimum monthly income required for a given property price
 * Inverse of the affordability calculation
 * 
 * @param {number} propertyPrice - Property price in SGD
 * @returns {number} Minimum monthly income required in SGD
 */
const calculateMinimumIncomeRequired = (propertyPrice) => {
    const loanAmount = propertyPrice * (1 - SINGAPORE_HDB_MORTGAGE_PARAMS.DOWN_PAYMENT_RATIO);
    const monthlyRate = SINGAPORE_HDB_MORTGAGE_PARAMS.ANNUAL_INTEREST_RATE / 12;
    const numPayments = SINGAPORE_HDB_MORTGAGE_PARAMS.LOAN_TENURE_YEARS * 12;
    
    // Calculate monthly payment using loan amount and mortgage parameters
    const monthlyPayment = loanAmount / ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);
    
    // Convert to minimum income based on 30% ratio
    const minimumIncome = monthlyPayment / SINGAPORE_HDB_MORTGAGE_PARAMS.INCOME_TO_PAYMENT_RATIO;
    
    return minimumIncome;
};

const AffordabilityAnalysisChart = ({ data, isDarkMode }) => {
    const analysisData = useMemo(() => {
        if (!data || data.length === 0) return { buckets: [], stats: {} };
        
        // Define income brackets (monthly household income in SGD)
        const incomeBrackets = [
            { min: 0, max: 7000, label: "≤ $7K", color: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(220, 38, 38, 0.8)" },
            { min: 7001, max: 10000, label: "$7K - $10K", color: isDarkMode ? "rgba(245, 158, 11, 0.8)" : "rgba(217, 119, 6, 0.8)" },
            { min: 10001, max: 14000, label: "$10K - $14K", color: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)" }
        ];

        /**
         * Calculate maximum affordable property price based on monthly income
         * Uses standard mortgage calculation formula: PV = PMT × [(1 - (1 + r)^-n) / r]
         * 
         * @param {number} monthlyIncome - Gross monthly household income in SGD
         * @returns {number} Maximum affordable property price in SGD
         */
        const calculateMaxAffordablePrice = (monthlyIncome) => {
            const maxMonthlyPayment = monthlyIncome * SINGAPORE_HDB_MORTGAGE_PARAMS.INCOME_TO_PAYMENT_RATIO;
            const monthlyRate = SINGAPORE_HDB_MORTGAGE_PARAMS.ANNUAL_INTEREST_RATE / 12;
            const numPayments = SINGAPORE_HDB_MORTGAGE_PARAMS.LOAN_TENURE_YEARS * 12;
            
            // Standard present value of annuity formula for loan amount calculation
            const maxLoanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate);
            
            // Convert loan amount to property price accounting for down payment
            const maxPropertyPrice = maxLoanAmount / (1 - SINGAPORE_HDB_MORTGAGE_PARAMS.DOWN_PAYMENT_RATIO);
            
            return maxPropertyPrice;
        };

        // Categorize units by affordability
        const buckets = incomeBrackets.map(bracket => {
            const maxAffordable = calculateMaxAffordablePrice(bracket.max === Infinity ? 25000 : bracket.max);
            const affordableUnits = data.filter(flat => flat.price <= maxAffordable);
            
            // Group by flat type
            const flatTypeBreakdown = {};
            affordableUnits.forEach(flat => {
                if (!flatTypeBreakdown[flat.flat_type]) {
                    flatTypeBreakdown[flat.flat_type] = [];
                }
                flatTypeBreakdown[flat.flat_type].push(flat);
            });

            return {
                ...bracket,
                maxAffordable,
                totalUnits: affordableUnits.length,
                flatTypeBreakdown,
                avgPrice: affordableUnits.length > 0 
                    ? affordableUnits.reduce((sum, flat) => sum + flat.price, 0) / affordableUnits.length 
                    : 0,
                minPrice: affordableUnits.length > 0 
                    ? Math.min(...affordableUnits.map(flat => flat.price))
                    : 0,
            };
        });

        // Calculate overall statistics
        const totalUnits = data.length;
        const avgPrice = data.reduce((sum, flat) => sum + flat.price, 0) / totalUnits;
        const minPrice = Math.min(...data.map(flat => flat.price));
        const maxPrice = Math.max(...data.map(flat => flat.price));

        // Find most affordable options by flat type
        const flatTypesFound = [...new Set(data.map(flat => flat.flat_type))];
        // Sort flat types using config order as source of truth
        const sortedFlatTypes = flatTypes.filter(type => flatTypesFound.includes(type));
        const mostAffordableByType = sortedFlatTypes.map(flatType => {
            const typeUnits = data.filter(flat => flat.flat_type === flatType);
            const cheapest = typeUnits.reduce((min, flat) => 
                flat.price < min.price ? flat : min
            );
            return { flatType, ...cheapest };
        });

        return {
            buckets,
            stats: {
                totalUnits,
                avgPrice,
                minPrice,
                maxPrice,
                mostAffordableByType
            }
        };
    }, [data]);

    const hasData = analysisData.buckets.length > 0 && analysisData.stats.totalUnits > 0;

    if (!hasData) {
        return (
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
                    Affordability Analysis
                </h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No data available for affordability analysis
                </p>
            </div>
        );
    }

    const chartData = {
        labels: analysisData.buckets.map(bucket => bucket.label),
        datasets: [
            {
                label: "Affordable Units",
                data: analysisData.buckets.map(bucket => bucket.totalUnits),
                backgroundColor: analysisData.buckets.map(bucket => bucket.color),
                borderColor: analysisData.buckets.map(bucket => bucket.color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    // Calculate appropriate step size based on the maximum value in the data
    const maxValue = Math.max(...analysisData.buckets.map(bucket => bucket.totalUnits));
    const calculateDynamicStepSize = (maxVal) => {
        if (maxVal <= 10) return 1;        // Very small datasets: 1, 2, 3, 4...
        if (maxVal <= 25) return 5;        // Small datasets: 5, 10, 15, 20, 25...
        if (maxVal <= 50) return 10;       // Small-medium datasets: 10, 20, 30, 40, 50...
        if (maxVal <= 100) return 25;      // Medium datasets: 25, 50, 75, 100...
        if (maxVal <= 250) return 50;      // Medium datasets: 50, 100, 150, 200, 250...
        if (maxVal <= 500) return 100;     // Medium-large datasets: 100, 200, 300, 400, 500...
        if (maxVal <= 1000) return 200;    // Large datasets: 200, 400, 600, 800, 1000...
        if (maxVal <= 2500) return 500;    // Large datasets: 500, 1000, 1500, 2000, 2500...
        if (maxVal <= 5000) return 1000;   // 1k steps for smaller datasets
        if (maxVal <= 20000) return 2000;  // 2k steps for medium datasets
        return 5000; // 5k steps for larger datasets
    };
    const stepSize = calculateDynamicStepSize(maxValue);

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
                        const bucket = analysisData.buckets[tooltipItems[0].dataIndex];
                        return `Household Income: ${bucket.label}`;
                    },
                    label: (tooltipItem) => {
                        const bucket = analysisData.buckets[tooltipItem.dataIndex];
                        const percentage = ((bucket.totalUnits / analysisData.stats.totalUnits) * 100).toFixed(1);
                        return [
                            `Affordable Units: ${bucket.totalUnits} (${percentage}%)`,
                            `Max Budget: ${formatCurrency(bucket.maxAffordable)}`,
                            `Avg Price: ${formatCurrency(bucket.avgPrice)}`,
                            `Cheapest: ${formatCurrency(bucket.minPrice)}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Monthly Household Income Range',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Number of Affordable Units',
                    color: isDarkMode ? '#e2e8f0' : '#4a5568',
                    font: { size: 12, weight: 'bold' },
                },
                ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    callback: function(value) {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'k';
                        }
                        return value;
                    },
                    stepSize: stepSize,
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
                    Affordability Analysis by Income Level
                </h3>
                <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Assumes 30% TDSR, 2.6% interest, 25-year term, 20% down payment
                </div>
            </div>

            <div style={{ height: "400px" }} className="mb-6">
                <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Total Units
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {analysisData.stats.totalUnits}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Avg Price
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatCurrency(analysisData.stats.avgPrice)}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Most Affordable
                    </p>
                    <p className="text-lg font-bold text-green-500">
                        {formatCurrency(analysisData.stats.minPrice)}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Most Expensive
                    </p>
                    <p className="text-lg font-bold text-red-500">
                        {formatCurrency(analysisData.stats.maxPrice)}
                    </p>
                </div>
            </div>

            {/* Most Affordable by Flat Type */}
            <div>
                <h4 className={`text-md font-semibold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>
                    💰 Most Affordable Option by Flat Type
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {analysisData.stats.mostAffordableByType.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-medium ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {item.flatType}
                                </span>
                                <span className="text-green-500 font-bold">
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {item.project_name}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Block {item.block} • {item.unit} • {item.project_town}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {item.size_sqm}m² • Level {item.level}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Min income needed: ~{formatCurrency(calculateMinimumIncomeRequired(item.price))} /month
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AffordabilityAnalysisChart;