import { useEffect, useState, useRef, useImperativeHandle, forwardRef, useMemo, useCallback } from "react";
import { Slider, Modal, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import CustomSelect from "../CustomSelect";
import { flatTypes } from "../../config/static";
import { formatPrice } from "../helpers";
import { sortSBFCodesChronologically } from "../helpers";
import { 
  MULTI_SELECT_FIELDS, 
  RANGE_KEYS, 
  ETHNIC_GROUP_OPTIONS, 
  REPURCHASED_OPTIONS 
} from "./filters/filterConstants";
import { 
  useCalculatedRanges,
  createDefaultRangeFilters,
  extractFilterOptions,
  formatOptions,
  generateMarks
} from "./filters/filterUtils";
import { filterData } from "./filters/filterLogic";

const Filters = forwardRef(({
  data,
  onFilter,
  isDarkMode,
  sbfCode,
  onSbfCodeChange,
  includeLrt,
  onIncludeLrtChange,
}, ref) => {

  // Filter data by selected SBF code for range calculations
  const sbfFilteredData = useMemo(() => {
    if (!data?.length || !sbfCode) return data || [];
    
    const selectedSbfCodeName = typeof sbfCode === 'object' ? sbfCode.name : sbfCode;
    return data.filter((item) => item.sbfCode === selectedSbfCodeName);
  }, [data, sbfCode]);

  // Extract filter options using utility
  const filterOptions = useMemo(() => {
    const filterOptionsData = sbfFilteredData?.length ? sbfFilteredData : data || [];
    // Always pass full data for SBF codes to ensure all available codes are shown
    return extractFilterOptions(filterOptionsData, data);
  }, [sbfFilteredData, data]);
  
  const {
    towns,
    projectNames,
    sbfCodes,
    TOPDates,
    nearestMRTs,
    nearestMrtLrts,
    schoolOptionsWithin1km,
    schoolOptionsWithin2km,
  } = filterOptions;

  const sortedSBFCodes = useMemo(() => 
    sortSBFCodesChronologically([...sbfCodes]), 
    [sbfCodes]
  );

  // Calculate ranges based on SBF-filtered data
  const ranges = useCalculatedRanges(sbfFilteredData?.length ? sbfFilteredData : data || [], includeLrt);

  // Create default range filters using utility
  const defaultRangeFilters = useMemo(() => 
    createDefaultRangeFilters(ranges), 
    [ranges]
  );

  const [sliderRanges, setSliderRanges] = useState(defaultRangeFilters);
  
  // Use useMemo to prevent initialDefaultFilters from changing on every render
  const initialDefaultFilters = useMemo(() => ({
    sbfCode: sortedSBFCodes.length
      ? { id: 0, name: sortedSBFCodes.at(0) }
      : null,
    town: [],
    projectName: [],
    flatType: [
      { id: 4, name: "4-room" },
      { id: 5, name: "5-room" },
      { id: 6, name: "Executive" },
      { id: 7, name: "3Gen" },
    ],
    TOPDate: [],
    nearestMRT: [],
    nearestMrtLrt: [],
    schools_within_1km: [],
    schools_within_2km: [],
    repurchased: null,
    ethnicGroup: null,
    ...defaultRangeFilters,
  }), [sortedSBFCodes, defaultRangeFilters]);

  // Use useRef to ensure stable initial state that doesn't cause re-initialization
  const stableInitialState = useRef(null);
  
  // Only set initial state once on first render
  if (!stableInitialState.current) {
    stableInitialState.current = { ...initialDefaultFilters };
  }

  // Initialize filters state
  const [filters, setFilters] = useState(() => stableInitialState.current);

  const presetFilterOptions = useMemo(() => [
    {
      key: "recommended",
      label: "Recommended",
      filters: {
        ...defaultRangeFilters,
        walkingTimeRange: [ranges.minWalkingTime, 10],
        walkingDistRange: [ranges.minWalkingDist, 1000],
        maxLeaseRange: [70, ranges.maxLease],
        levelRange: [10, ranges.maxLevel],
      },
    },
    {
      key: "value",
      label: "Good Value",
      filters: {
        ...defaultRangeFilters,
        pricePSFRange: [ranges.minPricePSF, ranges.minPricePSF + 200],
      },
    },
    {
      key: "nearMRT",
      label: "Near MRT",
      filters: {
        ...defaultRangeFilters,
        walkingTimeRange: [ranges.minWalkingTime, 5],
        walkingDistRange: [ranges.minWalkingDist, 500],
      },
    },
    {
      key: "premium",
      label: "Premium",
      filters: {
        ...defaultRangeFilters,
        levelRange: [20, ranges.maxLevel],
        sizeRange: [100, ranges.maxSize],
        priceRange: [ranges.maxPrice * 0.7, ranges.maxPrice],
      },
    },
    {
      key: "familyFriendly",
      label: "Family Friendly",
      filters: {
        ...defaultRangeFilters,
        flatType: [
          { id: 4, name: "4-room" },
          { id: 5, name: "5-room" },
          { id: 6, name: "Executive" },
        ],
        sizeRange: [80, ranges.maxSize],
        levelRange: [5, ranges.maxLevel],
        maxLeaseRange: [80, ranges.maxLease],
        walkingTimeRange: [ranges.minWalkingTime, 15],
      },
    },
  ], [defaultRangeFilters, ranges]);

  // State for UI components
  const [isMobileModalVisible, setIsMobileModalVisible] = useState(false);
  const [filterHeight, setFilterHeight] = useState("auto");
  const [contentBottomPadding, setContentBottomPadding] = useState(0); // NEW: internal bottom space
  const filterRef = useRef(null);
  const showModal = () => setIsMobileModalVisible(true);
  const hideModal = () => setIsMobileModalVisible(false);
  const [buttonBottom] = useState(20); // Fixed bottom position

  // Handle filter changes (for all except SBF code)
  const handleChange = useCallback((key, val) => {
    const newValue = MULTI_SELECT_FIELDS.includes(key)
      ? Array.isArray(val)
        ? val
        : val
          ? [val]
          : []
      : val ?? null;
    setFilters((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  }, []);

  // SBF code change handler
  const handleSbfCodeChange = useCallback((val) => {
    setFilters((prev) => ({
      ...prev,
      sbfCode: val,
    }));
    if (onSbfCodeChange) {
      onSbfCodeChange(val?.name);
    }
  }, [onSbfCodeChange]);

  const handleClearFilters = useCallback(() => {
    // Reset slider ranges to current SBF-filtered ranges
    setSliderRanges(defaultRangeFilters);

    // Reset all filters to stable initial state
    setFilters({
      ...stableInitialState.current,
      sbfCode: sortedSBFCodes.length
        ? { id: 0, name: sortedSBFCodes.at(0) }
        : null
    });

    // Reset SBF code in parent component
    if (onSbfCodeChange && sortedSBFCodes.length) {
      onSbfCodeChange(sortedSBFCodes.at(0));
    }
  }, [defaultRangeFilters, sortedSBFCodes, onSbfCodeChange]);

  // Handle MRT/LRT toggle
  const handleMrtLrtToggle = useCallback(() => {
    const newIncludeLrt = !includeLrt;
    onIncludeLrtChange(newIncludeLrt);
    
    // Clear relevant filters when toggling
    setFilters((prev) => ({
      ...prev,
      nearestMRT: [],
      nearestMrtLrt: []
    }));
  }, [includeLrt, onIncludeLrtChange]);

  // Add this to expose the reset function to parent
  useImperativeHandle(ref, () => ({
    resetFilters: handleClearFilters
  }));

  // Height & internal padding calculation for filter sidebar
  useEffect(() => {
    const calculateLayout = () => {
      const navbar = document.querySelector("nav");
      const footer = document.querySelector("footer");

      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const footerHeight = footer ? footer.offsetHeight : 60; // fallback if footer not found
      const viewportHeight = window.innerHeight;

      // Sidebar should go to bottom of viewport (no external gap for footer)
      const availableHeight = viewportHeight - navbarHeight + 10; // hardcode a longer filter
      setFilterHeight(`${Math.max(availableHeight, 200)}px`);

      // Put the footer spacing INSIDE the panel so the Clear button sits above bottom
      setContentBottomPadding(footerHeight); // small cushion
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);

    return () => {
      window.removeEventListener("resize", calculateLayout);
    };
  }, []);

  // Keep filters.sbfCode in sync with prop sbfCode (from parent)
  useEffect(() => {
    if (sbfCode) {
      setFilters((prev) => ({
        ...prev,
        sbfCode:
          typeof sbfCode === "object"
            ? sbfCode
            : { id: 0, name: sbfCode },
      }));
    }
    // eslint-disable-next-line
  }, [sbfCode]);

  // Update slider ranges when SBF code or includeLrt changes (recalculate ranges based on filtered data)
  useEffect(() => {
    setSliderRanges(defaultRangeFilters);
    
    // Also update the filter values to match the new ranges
    setFilters((prev) => ({
      ...prev,
      ...defaultRangeFilters,
    }));
  }, [defaultRangeFilters]);

  // Filtering logic using utility function
  const handleFilter = useCallback(() => {
    const filteredData = filterData(data, filters, includeLrt);
    onFilter(filteredData);
  }, [data, filters, includeLrt, onFilter]);

  // Run filtering whenever filters, data, or includeLrt change
  useEffect(() => {
    handleFilter();
    // eslint-disable-next-line
  }, [filters, data, includeLrt]);

  const sortedTowns = useMemo(() => [...towns].sort((a, b) => a.localeCompare(b)), [towns]);
  const sortedProjectNames = useMemo(() => [...projectNames].sort((a, b) => a.localeCompare(b)), [projectNames]);
  const sortedMRTStations = useMemo(() => [...nearestMRTs].sort((a, b) => a.localeCompare(b)), [nearestMRTs]);
  const sortedMrtLrtStations = useMemo(() => [...nearestMrtLrts].sort((a, b) => a.localeCompare(b)), [nearestMrtLrts]);
  const sortedTOPDates = useMemo(() => {
    const sorted = [...TOPDates].sort((a, b) => a.localeCompare(b));
    return sorted.length > 0
      ? [sorted[sorted.length - 1], ...sorted.slice(0, -1)]
      : []; // Move 'Completed' to the top
  }, [TOPDates]);

  const textClass = isDarkMode ? "text-gray-200" : "text-gray-900";
  const cardClass = isDarkMode ? "bg-gray-800" : "bg-gray-100";
  const buttonClass = isDarkMode
    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
    : "bg-gray-200 text-gray-900 hover:bg-gray-300";

  const filterConfigs = useMemo(() => [
    {
      label: "SBF Code",
      value: "sbfCode",
      options: formatOptions(sortedSBFCodes),
      isMulti: false,
      onChange: handleSbfCodeChange,
      valueProp: filters.sbfCode || null,
    },
    {
      label: "Town",
      value: "town",
      options: formatOptions(sortedTowns),
      isMulti: true,
    },
    {
      label: "Project",
      value: "projectName",
      options: formatOptions(sortedProjectNames),
      isMulti: true,
    },
    {
      label: "TOP Date",
      value: "TOPDate",
      options: formatOptions(sortedTOPDates),
      isMulti: true,
    },
    {
      label: "Flat Type",
      value: "flatType",
      options: formatOptions(flatTypes),
      isMulti: true,
    },
    ...(includeLrt ? [{
      label: "Nearest MRT/LRT",
      value: "nearestMrtLrt",
      options: formatOptions(sortedMrtLrtStations),
      isMulti: true,
    }] : [{
      label: "Nearest MRT",
      value: "nearestMRT",
      options: formatOptions(sortedMRTStations),
      isMulti: true,
    }]),
    {
      label: "Pri Sch < 1km",
      value: "schools_within_1km",
      options: formatOptions(schoolOptionsWithin1km),
      isMulti: true,
    },
    {
      label: "Pri Sch < 2km",
      value: "schools_within_2km",
      options: formatOptions(schoolOptionsWithin2km),
      isMulti: true,
    },
  ], [sortedSBFCodes, sortedTowns, sortedProjectNames, sortedTOPDates, 
      sortedMrtLrtStations, sortedMRTStations, schoolOptionsWithin1km, 
      schoolOptionsWithin2km, includeLrt, handleSbfCodeChange, filters.sbfCode]);

  const filtersUI = (
    <div className={`p-6 rounded-lg ${cardClass}`} style={{ paddingBottom: contentBottomPadding }}>
      <h2 className={`text-lg font-semibold mb-6 ${textClass}`}>Filters</h2>

      {/* MRT/LRT Toggle */}
      <div className="mb-6 space-y-2">
        <label className={`block text-sm font-medium ${textClass}`}>
          Station Type
        </label>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${!includeLrt ? 'font-semibold' : ''} ${textClass}`}>MRT Only</span>
          <button
            onClick={handleMrtLrtToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              includeLrt 
                ? 'bg-blue-600' 
                : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeLrt ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${includeLrt ? 'font-semibold' : ''} ${textClass}`}>Include LRT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        {filterConfigs.map(
          ({ label, value, options, isMulti, onChange, valueProp }) => (
            <div key={value} className="space-y-2">
              <label className={`block text-sm font-medium ${textClass}`}>
                {label}
              </label>
              <CustomSelect
                options={options}
                value={
                  typeof valueProp !== "undefined"
                    ? valueProp
                    : filters[value] || (isMulti ? [] : null)
                }
                onChange={
                  onChange
                    ? onChange
                    : (val) => handleChange(value, val)
                }
                isDarkMode={isDarkMode}
                placeholder={`Select ${label}`}
                isMulti={isMulti}
              />
            </div>
          )
        )}

        {/* Ethnic Group dropdown */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${textClass}`}>
            Ethnic Group
          </label>
          <CustomSelect
            options={ETHNIC_GROUP_OPTIONS}
            value={
              ETHNIC_GROUP_OPTIONS.find(
                (opt) => opt.value === filters.ethnicGroup
              ) || ETHNIC_GROUP_OPTIONS[0]
            }
            onChange={(val) => {
              setFilters((prev) => ({
                ...prev,
                ethnicGroup: val?.value ?? null,
              }));
            }}
            isDarkMode={isDarkMode}
            placeholder="All"
            isMulti={false}
          />
        </div>

        {/* Repurchased dropdown */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${textClass}`}>
            Repurchased
          </label>
          <CustomSelect
            options={REPURCHASED_OPTIONS}
            value={
              filters.repurchased === null
                ? REPURCHASED_OPTIONS[0]
                : filters.repurchased
                  ? REPURCHASED_OPTIONS[1]
                  : REPURCHASED_OPTIONS[2]
            }
            onChange={(val) => {
              setFilters((prev) => ({
                ...prev,
                repurchased: val?.value ?? null,
              }));
            }}
            isDarkMode={isDarkMode}
            placeholder="All"
            isMulti={false}
          />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {useMemo(() => [
          {
            label: "Price (SGD)",
            key: "priceRange",
            min: ranges.minPrice,
            max: ranges.maxPrice,
          },
          {
            label: "Size (sqm)",
            key: "sizeRange",
            min: ranges.minSize,
            max: ranges.maxSize,
          },
          {
            label: "Price per sqft (PSF)",
            key: "pricePSFRange",
            min: ranges.minPricePSF,
            max: ranges.maxPricePSF,
          },
          {
            label: "Floor Level",
            key: "levelRange",
            min: ranges.minLevel,
            max: ranges.maxLevel,
          },
          {
            label: `Walking Time to ${includeLrt ? 'MRT/LRT' : 'MRT'} (mins)`,
            key: "walkingTimeRange",
            min: ranges.minWalkingTime,
            max: ranges.maxWalkingTime,
          },
          {
            label: `Walking Distance to ${includeLrt ? 'MRT/LRT' : 'MRT'} (m)`,
            key: "walkingDistRange",
            min: ranges.minWalkingDist,
            max: ranges.maxWalkingDist,
          },
          {
            label: "Max Lease (years)",
            key: "maxLeaseRange",
            min: ranges.minLease,
            max: ranges.maxLease,
          },
          {
            label: "ROI (%)",
            key: "roiRange",
            min: ranges.minROI,
            max: ranges.maxROI,
          },
        ], [ranges, includeLrt]).map(({ label, key, min, max }) => {
          const isPrice = key === "priceRange";
          const isROI = key === "roiRange";
          return (
            <div key={key} className="space-y-2">
              <label className={`block text-sm font-medium ${textClass}`}>
                {label}
              </label>
              <Slider
                key={`slider-${key}`}
                range
                min={min}
                max={max}
                marks={generateMarks(min, max, isPrice ? formatPrice : isROI ? (val) => `${val.toFixed(1)}%` : null)}
                value={sliderRanges[key]}
                onChange={(val) =>
                  setSliderRanges((prev) => ({ ...prev, [key]: val }))
                }
                onChangeComplete={(val) => {
                  setSliderRanges((prev) => ({ ...prev, [key]: val }));
                  handleChange(key, val);
                }}
                tooltip={{
                  formatter: isPrice ? (val) => formatPrice(val) : isROI ? (val) => `${val.toFixed(1)}%` : undefined
                }}
                className={`w-full ${isDarkMode ? "slider-dark" : "slider-light"
                  }`}
                trackStyle={{
                  backgroundColor: isDarkMode ? "#4f46e5" : "#2563eb",
                }}
                handleStyle={{
                  borderColor: isDarkMode ? "#4f46e5" : "#2563eb",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-8">
        {presetFilterOptions.map(({ key, label, filters: preset }) => (
          <Button
            key={key}
            size="small"
            className={`rounded-full border ${isDarkMode
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            onClick={() => {
              setSliderRanges((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  RANGE_KEYS
                    .filter((key) => preset[key] != null)
                    .map((key) => [key, preset[key]])
                ),
              }));

              setFilters((prev) => ({
                ...prev,
                ...preset,
                sbfCode: prev.sbfCode, // don't override sbfCode
              }));
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {isMobileModalVisible && (
        <button
          onClick={hideModal}
          className={`mt-4 w-full px-6 py-3 rounded-md font-medium transition-colors ${buttonClass}`}
        >
          Apply Filters
        </button>
      )}

      <button
        onClick={handleClearFilters}
        className={`mt-4 w-full px-6 py-3 rounded-md font-medium transition-colors ${buttonClass}`}
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <>
      <div
        ref={filterRef}
        className="hidden lg:block fixed left-0 top-16 w-80 p-6 overflow-y-auto shadow-lg bg-white dark:bg-gray-800"
        style={{ zIndex: 10, height: filterHeight }}
      >
        {filtersUI}
      </div>

      <div
        className="lg:hidden fixed right-6 z-50"
        style={{ bottom: `${buttonBottom}px` }}
      >
        <Button
          type="primary"
          icon={<FilterOutlined />}
          onClick={showModal}
          className="flex items-center gap-2 shadow-lg bg-blue-600 hover:bg-blue-700 border-blue-600 text-white
      dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-100"
        >
          Filters
        </Button>
      </div>

      <Modal
        open={isMobileModalVisible}
        onCancel={hideModal}
        footer={null}
        width="90%"
        className="filters-modal"
        rootClassName="filters-modal-root"
      >
        {filtersUI}
      </Modal>
    </>
  );
});

export default Filters;