import { useMemo } from "react";

/**
 * Calculate min/max ranges for numeric fields based on data
 */
export const calculateRanges = (data, includeLrt) => {
  if (!data?.length) {
    return {
      minPrice: 0,
      maxPrice: 1000000,
      minSize: 0,
      maxSize: 200,
      minPricePSF: 0,
      maxPricePSF: 1200,
      minWalkingTime: 0,
      maxWalkingTime: 60,
      minWalkingDist: 0,
      maxWalkingDist: 5000,
      minLease: 0,
      maxLease: 99,
      minLevel: 0,
      maxLevel: 50,
      minROI: -50,
      maxROI: 100,
    };
  }

  const minPrice = Math.min(...data.map((item) => item.price || 0));
  const maxPrice = Math.max(...data.map((item) => item.price || 0));
  const minSize = Math.min(...data.map((item) => item.size_sqm || 0));
  const maxSize = Math.max(...data.map((item) => item.size_sqm || 0));
  const minPricePSF = Math.min(...data.map((item) => item.price_psf || 0));
  const maxPricePSF = Math.max(...data.map((item) => item.price_psf || 0));
  
  const minWalkingTime = Math.min(...data.map((item) => 
    includeLrt 
      ? item.mrt_lrt_walking_time_in_mins || item.walking_time_in_mins || 0
      : item.walking_time_in_mins || 0
  ));
  const maxWalkingTime = Math.max(...data.map((item) => 
    includeLrt 
      ? item.mrt_lrt_walking_time_in_mins || item.walking_time_in_mins || 0
      : item.walking_time_in_mins || 0
  ));
  
  const minWalkingDist = Math.min(...data.map((item) => 
    includeLrt 
      ? item.mrt_lrt_walking_distance_in_m || item.walking_distance_in_m || 0
      : item.walking_distance_in_m || 0
  ));
  const maxWalkingDist = Math.max(...data.map((item) => 
    includeLrt 
      ? item.mrt_lrt_walking_distance_in_m || item.walking_distance_in_m || 0
      : item.walking_distance_in_m || 0
  ));

  const minLease = Math.min(...data.map((item) => item.max_lease || 0));
  const maxLease = Math.max(...data.map((item) => item.max_lease || 0));
  const minLevel = Math.min(...data.map((item) => item.level || 0));
  const maxLevel = Math.max(...data.map((item) => item.level || 50));

  // Calculate ROI range from items that have both price and resale value
  const roiValues = data
    .filter(item => item.price && item.approximate_resale_value)
    .map(item => ((item.approximate_resale_value - item.price) / item.price) * 100);
  const minROI = roiValues.length ? Math.min(...roiValues) : -50;
  const maxROI = roiValues.length ? Math.max(...roiValues) : 100;

  return {
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    minPricePSF,
    maxPricePSF,
    minWalkingTime,
    maxWalkingTime,
    minWalkingDist,
    maxWalkingDist,
    minLease,
    maxLease,
    minLevel,
    maxLevel,
    minROI,
    maxROI,
  };
};

/**
 * Create default range filters object
 */
export const createDefaultRangeFilters = (ranges) => ({
  priceRange: [ranges.minPrice, ranges.maxPrice],
  sizeRange: [ranges.minSize, ranges.maxSize],
  pricePSFRange: [ranges.minPricePSF, ranges.maxPricePSF],
  walkingTimeRange: [ranges.minWalkingTime, ranges.maxWalkingTime],
  walkingDistRange: [ranges.minWalkingDist, ranges.maxWalkingDist],
  maxLeaseRange: [ranges.minLease, ranges.maxLease],
  levelRange: [ranges.minLevel, ranges.maxLevel],
  roiRange: [ranges.minROI, ranges.maxROI],
});

/**
 * Extract unique values from data for dropdown options
 * @param {Array} data - Main data to extract most options from (can be SBF-filtered)
 * @param {Array} [sbfCodeData] - Optional separate data for extracting SBF codes (should be full dataset)
 */
export const extractFilterOptions = (data, sbfCodeData = null) => {
  if (!data?.length) {
    return {
      towns: [],
      projectNames: [],
      sbfCodes: [],
      TOPDates: [],
      nearestMRTs: [],
      nearestMrtLrts: [],
      schoolOptionsWithin1km: [],
      schoolOptionsWithin2km: [],
    };
  }

  const towns = [...new Set(data.map(item => item.project_town).filter(Boolean))];
  const projectNames = [...new Set(data.map(item => item.project_name).filter(Boolean))];
  
  // Use separate data for SBF codes if provided, otherwise use main data
  const dataForSbfCodes = sbfCodeData || data;
  const sbfCodes = [...new Set(dataForSbfCodes.map(item => item.sbfCode))];
  
  const TOPDates = [...new Set(data.map(item => item.top_delay_date).filter(Boolean))];
  const nearestMRTs = [...new Set(data.map(item => item.nearest_mrt).filter(Boolean))];
  const nearestMrtLrts = [...new Set(data.map(item => item.nearest_mrt_lrt).filter(Boolean))];

  // Extract schools
  const schoolsWithin1kmSet = new Set();
  const schoolsWithin2kmSet = new Set();

  data.forEach((item) => {
    // 1km schools
    (item.schools_within_1km || []).forEach((school) => {
      if (school?.SCHOOLNAME) {
        schoolsWithin1kmSet.add(school.SCHOOLNAME);
      }
    });

    // 2km schools
    (item.schools_within_2km || []).forEach((school) => {
      if (school?.SCHOOLNAME) {
        schoolsWithin2kmSet.add(school.SCHOOLNAME);
      }
    });
  });

  const schoolOptionsWithin1km = [...schoolsWithin1kmSet].sort((a, b) => a.localeCompare(b));
  const schoolOptionsWithin2km = [...schoolsWithin2kmSet].sort((a, b) => a.localeCompare(b));

  return {
    towns,
    projectNames,
    sbfCodes,
    TOPDates,
    nearestMRTs,
    nearestMrtLrts,
    schoolOptionsWithin1km,
    schoolOptionsWithin2km,
  };
};

/**
 * Format options for CustomSelect component
 */
export const formatOptions = (options) =>
  options.map((option, index) => ({ id: index + 1, name: option }));

/**
 * Generate marks for sliders
 */
export const generateMarks = (min, max, formatter) => {
  const mid = Math.floor((min + max) / 2);
  return {
    [min]: formatter ? formatter(min) : `${min}`,
    [mid]: formatter ? formatter(mid) : `${mid}`,
    [max]: formatter ? formatter(max) : `${max}`,
  };
};

/**
 * Custom hook to calculate and memoize ranges
 */
export const useCalculatedRanges = (data, includeLrt) => {
  return useMemo(() => {
    return calculateRanges(data, includeLrt);
  }, [data, includeLrt]);
};