import { useState, useRef } from "react";
import DataTable from "./DataTable";
import FlatMap from "./FlatMap";
import CountChart from "./CountChart";
import ROIAnalysisChart from "./ROIAnalysisChart";
import LocationValueChart from "./LocationValueChart";
import AffordabilityAnalysisChart from "./AffordabilityAnalysisChart";
import CompletionTimelineChart from "./CompletionTimelineChart";
import RemainingLeaseAnalysisChart from "./RemainingLeaseAnalysisChart";
import FloorLevelAnalysisChart from "../admin_dashboard/FloorLevelAnalysisChart";
import Filters from "./Filters";
import WarningBanner from "./WarningBanner";
import DashboardLoadingSpinner from "../DashboardLoadingSpinner";
import NetworkErrorBoundary from "../NetworkErrorBoundary";
import ConnectionStatusBar from "../ConnectionStatusBar";
import testData from "../../config/testData";
import useFetchCSV from "../../hooks/useFetchCSV";
import useGetDemand from "../../hooks/useGetDemand";
import { envVars } from "../../config/envConfig";

const Dashboard = ({ isDarkMode, userId, paymentDocCount, latestSbfCode }) => {
  const [selectedSbfCode, setSelectedSbfCode] = useState(latestSbfCode);
  const [filteredData, setFilteredData] = useState([]);
  const [includeLrt, setIncludeLrt] = useState(false); // MRT/LRT toggle state
  const filtersRef = useRef();

  let {
    data: csvData,
    isLoading: isLoadingCSV,
    isFetching: isFetchingCSV,
    isRefetching: isRefetchingCSV,
    error: csvError,
    refetch: refetchCSV,
  } = useFetchCSV({
    enabled: true,
    userId,
    paymentDocCount,
  });

  const {
    demandData,
    capturedAt,
    isLoading: isLoadingDemand,
    error: demandError,
    refetch: refetchDemand,
  } = useGetDemand(selectedSbfCode);

  if (envVars.testMode) {
    csvData = testData
  }

  const handleFilter = (filteredResults) => {
    setFilteredData(filteredResults);
  };

  const handleRetry = () => {
    if (csvError) refetchCSV();
    if (demandError) refetchDemand();
  };

  // Show error boundary if there are critical errors
  if (csvError || demandError) {
    const primaryError = csvError || demandError;
    return (
      <NetworkErrorBoundary 
        error={primaryError} 
        retry={handleRetry} 
        isRetrying={isFetchingCSV || isLoadingDemand}
      />
    );
  }

  const isDashboardLoading =
    isLoadingCSV
    || (!csvData?.length && !isRefetchingCSV); // Only show loading if no data AND not refetching cached data
  // || !demandData?.length;

  // Show enhanced loading spinner with network awareness
  if (isDashboardLoading) {
    const loadingMessage = isLoadingDemand 
      ? "Loading market demand data..." 
      : "Loading dashboard data...";
    
    return <DashboardLoadingSpinner 
      isUsingCachedData={isRefetchingCSV && !!csvData} 
      loadingMessage={loadingMessage}
    />;
  }

  // Show demand loading state separately without blocking main dashboard
  const isDemandLoading = isLoadingDemand && !demandData?.length;

  // Show empty state if we have CSV data loaded AND no filtered data
  const shouldShowEmptyState = csvData && csvData.length > 0 && filteredData.length === 0;
  
  return (
    <div>
      <ConnectionStatusBar 
        isRefetching={isRefetchingCSV || demandData?.isFetching}
        isUsingCachedData={!!csvData && isRefetchingCSV}
        isDarkMode={isDarkMode}
      />
      <Filters
        data={csvData}
        onFilter={handleFilter}
        isDarkMode={isDarkMode}
        sbfCode={selectedSbfCode}
        onSbfCodeChange={setSelectedSbfCode}
        ref={filtersRef}
        includeLrt={includeLrt}
        onIncludeLrtChange={setIncludeLrt}
      />

      {shouldShowEmptyState ? (
        <div className={`p-8 text-center rounded-lg mx-4 ${isDarkMode ? "bg-gray-900 text-slate-300" : "bg-gray-100 text-slate-600"}`}>
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium">
              No units match your filters
            </h3>
            <p className="mt-2">
              Try adjusting your filter criteria to see available units.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  // Access the Filters component's reset function via ref
                  if (filtersRef.current) {
                    filtersRef.current.resetFilters();
                  }
                }}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${isDarkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      ) : (
      <>
        <WarningBanner />

        <div className="max-w-full mx-auto mb-10">
        <section className="mb-8">
          <DataTable data={filteredData} isDarkMode={isDarkMode} includeLrt={includeLrt} />
        </section>

        {isDemandLoading && (
          <section className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <span className="text-gray-600 dark:text-gray-300 text-sm">Loading market demand data...</span>
              </div>
            </div>
          </section>
        )}

        {demandData?.length &&
          <section className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <CountChart
              data={filteredData}
              demandData={demandData}
              capturedAt={capturedAt}
              groupBy="project_town"
              subGroupBy="flat_type"
              label="Town"
              isDarkMode={isDarkMode}
              sbfCode={selectedSbfCode}
            />
          </section>
        }

        {/* Investment & Market Intelligence Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-200">
            💰 Investment Analysis & Market Intelligence
          </h2>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <ROIAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
          </div>

          <section className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📍</span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">
                Location Map
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Interactive map showing all filtered properties with color-coded markers by flat type
            </p>
            <FlatMap data={filteredData} isDarkMode={isDarkMode} />
          </section>

          {/* <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <LocationValueChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
          </div> */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <RemainingLeaseAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <CompletionTimelineChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <FloorLevelAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
          </div>

          {/* <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <AffordabilityAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
            </div>
          </div> */}
        </section>
        </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;