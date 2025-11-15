import { useMemo, useCallback } from "react";
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
import { formatCurrencyShort } from "../helpers";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FloorLevelChart = ({ data, isDarkMode }) => {
  // Helper function for absolute level categorization
  const getLevelCategory = (level) => {
    if (level <= 5) return "Low (1-5)";
    if (level <= 10) return "Mid-Low (6-10)";
    if (level <= 15) return "Mid (11-15)";
    if (level <= 20) return "Mid-High (16-20)";
    return "High (21+)";
  };

  // Helper function for relative height categorization
  const getRelativeHeightCategory = (level, maxFloorLvl) => {
    if (!maxFloorLvl || maxFloorLvl <= 0) return null;
    const relativePosition = level / maxFloorLvl;
    if (relativePosition <= 0.33) return "Low";
    if (relativePosition <= 0.67) return "Mid";
    return "High";
  };

  // Helper function to get comprehensive height description
  const getHeightDescription = useCallback((level, maxFloorLvl) => {
    const absolute = getLevelCategory(level);
    if (!maxFloorLvl) {
      return { absolute, relative: null, description: `${absolute} floor` };
    }
    
    const relative = getRelativeHeightCategory(level, maxFloorLvl);
    const percentage = Math.round((level / maxFloorLvl) * 100);
    
    // Generate smart description
    if (maxFloorLvl <= 5) {
      // Low-rise building
      if (relative === "High") {
        return { 
          absolute, 
          relative, 
          description: `Top floor (${percentage}% up) - low-rise building`,
          insight: "Great views for a low-rise, minimal elevator wait"
        };
      }
    } else if (maxFloorLvl <= 15) {
      // Mid-rise building
      if (relative === "High" && absolute === "Low") {
        return { 
          absolute, 
          relative, 
          description: `High in building (${percentage}% up) but low floor overall`,
          insight: "Best of both worlds: easy access, good views within building"
        };
      }
    } else {
      // High-rise building
      if (relative === "Low" && level > 10) {
        return { 
          absolute, 
          relative, 
          description: `Mid-high floor (${percentage}% up) in tall building`,
          insight: "Good elevation with reasonable elevator wait"
        };
      }
      if (relative === "High" && level > 20) {
        return { 
          absolute, 
          relative, 
          description: `High floor (${percentage}% up) - premium height`,
          insight: "Excellent views, longer elevator wait"
        };
      }
    }
    
    return { 
      absolute, 
      relative, 
      description: `${relative} in building (${percentage}% up), ${absolute} overall`,
      insight: null
    };
  }, []);

  const floorLevelData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((flat) => flat.level && flat.price && flat.level > 0)
      .map((flat) => {
        const heightInfo = getHeightDescription(flat.level, flat.max_floor_lvl);
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
          maxFloorLvl: flat.max_floor_lvl,
          heightInfo: heightInfo,
        };
      });
  }, [data, getHeightDescription]);

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
        hasMaxFloorData: false,
        avgBuildingHeight: 0,
        relativeHeightDistribution: { low: 0, mid: 0, high: 0 },
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
    
    // Calculate building height statistics
    const unitsWithMaxFloor = floorLevelData.filter(p => p.maxFloorLvl && p.maxFloorLvl > 0);
    const hasMaxFloorData = unitsWithMaxFloor.length > 0;
    const avgBuildingHeight = hasMaxFloorData 
      ? unitsWithMaxFloor.reduce((sum, p) => sum + p.maxFloorLvl, 0) / unitsWithMaxFloor.length 
      : 0;
    
    // Calculate relative height distribution
    const relativeHeightDistribution = { low: 0, mid: 0, high: 0 };
    unitsWithMaxFloor.forEach(p => {
      const relativeCategory = getRelativeHeightCategory(p.x, p.maxFloorLvl);
      if (relativeCategory === "Low") relativeHeightDistribution.low++;
      else if (relativeCategory === "Mid") relativeHeightDistribution.mid++;
      else if (relativeCategory === "High") relativeHeightDistribution.high++;
    });
    
    return {
      totalUnits: floorLevelData.length,
      avgPrice,
      minLevel: Math.min(...levels),
      maxLevel: Math.max(...levels),
      avgLevel,
      priceCorrelation: correlation,
      hasMaxFloorData,
      avgBuildingHeight: Math.round(avgBuildingHeight),
      relativeHeightDistribution,
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

  // Find best value floor categories based on ROI and price premium
  const rankedCategories = useMemo(() => {
    if (levelCategoryStats.length === 0) return [];
    return [...levelCategoryStats]
      .map(cat => ({
        ...cat,
        valueScore: (cat.avgROI || 0) - (cat.pricePremium * 0.5) // Higher ROI minus price premium = better value
      }))
      .sort((a, b) => b.valueScore - a.valueScore);
  }, [levelCategoryStats]);

  const hasData = floorLevelData.length > 0;
  const bestValueCategory = rankedCategories[0];

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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>
          🏢 Floor Level Guide - Which Floor Should You Buy?
        </h3>
        <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {stats.totalUnits} units analyzed
        </div>
      </div>

      {/* Best Value Recommendation - Make this prominent */}
      <div className={`mb-6 p-5 rounded-lg border-2 ${
        isDarkMode 
          ? "bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500" 
          : "bg-gradient-to-r from-green-50 to-blue-50 border-green-400"
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <h4 className={`text-base font-bold mb-2 ${isDarkMode ? "text-green-200" : "text-green-800"}`}>
              Best Value: {bestValueCategory.category} Floors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Average Price</p>
                <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                  {formatCurrencyShort(bestValueCategory.avgPrice)}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Expected ROI</p>
                <p className="text-lg font-bold text-green-600">
                  {bestValueCategory.avgROI ? `${bestValueCategory.avgROI.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Available Units</p>
                <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                  {bestValueCategory.count}
                </p>
              </div>
            </div>
            <p className={`text-sm ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
              💡 <strong>Why this is good:</strong> {
                bestValueCategory.pricePremium < 0 
                  ? `${Math.abs(bestValueCategory.pricePremium).toFixed(1)}% below average price` 
                  : bestValueCategory.pricePremium < 5
                    ? "Fairly priced"
                    : "High ROI potential"
              } with {bestValueCategory.avgROI && bestValueCategory.avgROI >= 40 ? "excellent" : "good"} resale value growth.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary - Simplified */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Lowest Price
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {formatCurrencyShort(Math.min(...levelCategoryStats.map(c => c.avgPrice)))}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            {levelCategoryStats.find(c => c.avgPrice === Math.min(...levelCategoryStats.map(s => s.avgPrice)))?.category}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Highest ROI
          </p>
          <p className="text-xl font-bold text-green-600">
            {Math.max(...levelCategoryStats.filter(c => c.avgROI).map(c => c.avgROI)).toFixed(1)}%
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            {levelCategoryStats.find(c => c.avgROI === Math.max(...levelCategoryStats.filter(s => s.avgROI).map(s => s.avgROI)))?.category}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Price Range
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {stats.minLevel}-{stats.maxLevel}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            Floor levels
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <p className={`text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Floor Impact
          </p>
          <p className={`text-xl font-bold ${
            Math.abs(stats.priceCorrelation) > 0.3 ? "text-red-600" : "text-green-600"
          }`}>
            {Math.abs(stats.priceCorrelation) > 0.3 ? "High" : "Low"}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            {Math.abs(stats.priceCorrelation) > 0.3 ? "Floor matters" : "All floors similar"}
          </p>
        </div>
      </div>

      {/* Simple buying advice */}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
        <p className={`text-sm font-medium mb-2 ${isDarkMode ? "text-blue-200" : "text-blue-800"}`}>
          💡 Quick Buying Tip:
        </p>
        <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
          {stats.priceCorrelation > 0.3 
            ? `Floor level strongly affects price here. ${bestValueCategory.category} floors offer the best value-for-money. Higher floors cost significantly more but may not deliver proportional resale value.`
            : stats.priceCorrelation < -0.3 
              ? `Surprisingly, lower floors may cost more here. Consider ${bestValueCategory.category} floors for better value and similar quality.`
              : `Floor level doesn't significantly impact price here - all floors are fairly priced. Choose ${bestValueCategory.category} floors for the highest ROI potential.`
          }
        </p>
      </div>

      {/* Relative Height Insights - New Section */}
      {stats.hasMaxFloorData && (
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-purple-900/20 border border-purple-700" : "bg-purple-50 border border-purple-200"}`}>
          <p className={`text-sm font-medium mb-3 ${isDarkMode ? "text-purple-200" : "text-purple-800"}`}>
            🏢 Building Height Context:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Avg Building Height</p>
              <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                {stats.avgBuildingHeight} floors
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Low in Building</p>
              <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                {stats.relativeHeightDistribution.low} units
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Mid in Building</p>
              <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                {stats.relativeHeightDistribution.mid} units
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>High in Building</p>
              <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                {stats.relativeHeightDistribution.high} units
              </p>
            </div>
          </div>
          <p className={`text-xs ${isDarkMode ? "text-purple-300" : "text-purple-700"}`}>
            💡 <strong>Understanding Height:</strong> {' '}
            {stats.avgBuildingHeight <= 10 
              ? "Mostly low-rise buildings (≤10 floors). Units at top floors get good views without long elevator waits."
              : stats.avgBuildingHeight <= 20
                ? "Mix of mid-rise buildings (11-20 floors). Mid-high units balance views with accessibility."
                : "Primarily high-rise buildings (20+ floors). Consider elevator wait times and whether premium top-floor views justify the price difference."
            }
          </p>
        </div>
      )}

      {/* Simplified Floor Comparison - Ranked by Value */}
      <div className="mt-6">
        <h4 className={`text-base font-semibold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
          📊 Compare All Floor Levels - Ranked by Best Value
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedCategories.map((stat, index) => {
            const isTopChoice = index === 0;
            const isGoodChoice = index <= Math.ceil(rankedCategories.length / 3);
            const isPoorChoice = index >= rankedCategories.length - Math.ceil(rankedCategories.length / 3);
            
            return (
              <div
                key={stat.category}
                className={`p-4 rounded-lg border-2 relative ${
                  isTopChoice
                    ? isDarkMode 
                      ? "bg-green-900/20 border-green-500" 
                      : "bg-green-50 border-green-500"
                    : isGoodChoice
                      ? isDarkMode
                        ? "bg-blue-900/10 border-blue-600"
                        : "bg-blue-50 border-blue-400"
                      : isDarkMode
                        ? "bg-slate-800 border-slate-600"
                        : "bg-gray-50 border-gray-300"
                }`}
              >
                {/* Ranking Badge */}
                <div className="absolute top-3 right-3">
                  {isTopChoice && (
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-600 text-white">
                      #1 BEST
                    </span>
                  )}
                  {!isTopChoice && isGoodChoice && (
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                      #{index + 1} GOOD
                    </span>
                  )}
                  {isPoorChoice && !isTopChoice && !isGoodChoice && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-400 text-white"
                    }`}>
                      #{index + 1}
                    </span>
                  )}
                </div>

                <div className="pr-16">
                  <h5 className={`text-lg font-bold mb-3 ${
                    isTopChoice 
                      ? "text-green-600" 
                      : isDarkMode ? "text-white" : "text-black"
                  }`}>
                    {stat.category}
                  </h5>
                  
                  <div className="space-y-2">
                    {/* Price */}
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        💰 Price:
                      </span>
                      <span className={`text-base font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatCurrencyShort(stat.avgPrice)}
                        {stat.pricePremium !== 0 && (
                          <span className={`text-xs ml-2 ${
                            stat.pricePremium > 5 ? "text-red-600" : 
                            stat.pricePremium > 0 ? "text-yellow-600" : 
                            "text-green-600"
                          }`}>
                            ({stat.pricePremium > 0 ? '+' : ''}{stat.pricePremium.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* ROI */}
                    {stat.avgROI !== null && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          📈 ROI:
                        </span>
                        <span className={`text-base font-bold ${
                          stat.avgROI >= 40 ? "text-green-600" : 
                          stat.avgROI >= 25 ? "text-blue-600" : 
                          "text-yellow-600"
                        }`}>
                          {stat.avgROI.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {/* Resale Value */}
                    {stat.avgResale && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          💵 Resale:
                        </span>
                        <span className={`text-base font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                          {formatCurrencyShort(stat.avgResale)}
                        </span>
                      </div>
                    )}

                    {/* Available Units */}
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        🏘️ Available:
                      </span>
                      <span className={`text-base font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                        {stat.count} unit{stat.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Value Indicator */}
                  <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Value:
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            isTopChoice ? "bg-green-600" : 
                            isGoodChoice ? "bg-blue-600" : 
                            "bg-gray-400"
                          }`}
                          style={{ 
                            width: `${Math.max(20, Math.min(100, (stat.valueScore / Math.max(...rankedCategories.map(c => c.valueScore))) * 100))}%` 
                          }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${
                        isTopChoice ? "text-green-600" : 
                        isGoodChoice ? "text-blue-600" : 
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {isTopChoice ? "Best" : isGoodChoice ? "Good" : "Fair"}
                      </span>
                    </div>
                  </div>

                  {/* Simple Recommendation */}
                  {isTopChoice && (
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                      ✅ <strong>Recommended:</strong> Best balance of price and ROI
                    </p>
                  )}
                  {!isTopChoice && isGoodChoice && (
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                      👍 <strong>Good option:</strong> Solid investment choice
                    </p>
                  )}
                  {isPoorChoice && !isGoodChoice && (
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      ⚠️ Consider other floors for better value
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Legend */}
        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-slate-800/50" : "bg-gray-100"}`}>
          <p className={`text-sm font-medium mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>
            📖 How to Read This:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💰</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Price</p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Average SBF price for this floor category. Green % = discount, Red % = premium vs average.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>ROI (Return on Investment)</p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Expected profit % when selling. Green ≥40% = Excellent, Blue 25-40% = Good, Yellow &lt;25% = Fair.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">💵</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Resale Value</p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Estimated future market value based on historical data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Value Score</p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Overall ranking considering ROI and price. Higher bar = better value for money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorLevelChart;