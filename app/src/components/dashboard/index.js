import { useState, useRef, useEffect } from "react";
import DataTable from "./DataTable";
import FlatMap from "./FlatMap";
import CountChart from "./CountChart";
import ROIAnalysisChart from "./ROIAnalysisChart";
import FloorLevelChart from "./FloorLevelChart";
import LocationValueChart from "./LocationValueChart";
import AffordabilityAnalysisChart from "./AffordabilityAnalysisChart";
import CompletionTimelineChart from "./CompletionTimelineChart";
import RemainingLeaseAnalysisChart from "./RemainingLeaseAnalysisChart";
import Filters from "./Filters";
import WarningBanner from "./WarningBanner";
import DashboardLoadingSpinner from "../DashboardLoadingSpinner";
import NetworkErrorBoundary from "../NetworkErrorBoundary";
import ConnectionStatusBar from "../ConnectionStatusBar";
import testData from "../../config/testData";
import useFetchCSV from "../../hooks/useFetchCSV";
import useGetDemand from "../../hooks/useGetDemand";
import { envVars } from "../../config/envConfig";

const SectionHeading = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 text-lg">
      {icon}
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card ${className}`}>
    {children}
  </div>
);

const Dashboard = ({ isDarkMode, userId, paymentDocCount, latestSbfCode, accessibleSbfCodes }) => {
  const [selectedSbfCode, setSelectedSbfCode] = useState(latestSbfCode);
  const [filteredData, setFilteredData] = useState([]);
  const [includeLrt, setIncludeLrt] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
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
    sbfCode: selectedSbfCode,
  });

  const {
    demandData,
    capturedAt,
    isLoading: isLoadingDemand,
    error: demandError,
    refetch: refetchDemand,
  } = useGetDemand(selectedSbfCode);

  if (envVars.testMode) {
    csvData = testData;
  }

  const handleFilter = (filteredResults) => {
    setFilteredData(filteredResults);
  };

  useEffect(() => {
    let timeoutId;
    if ((isLoadingCSV || isLoadingDemand) && !envVars.testMode && !csvData?.length) {
      timeoutId = setTimeout(() => {
        if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
          console.warn('[Dashboard] Loading timeout reached - forcing error state');
        }
        setLoadingTimeout(true);
      }, 60000);
    } else {
      setLoadingTimeout(false);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isLoadingCSV, isLoadingDemand, csvData?.length]);

  const handleRetry = () => {
    if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Retry requested - CSV Error:', csvError, 'Demand Error:', demandError);
    }
    setLoadingTimeout(false);
    if (csvError) refetchCSV();
    if (demandError) refetchDemand();
  };

  const shouldShowErrorBoundary = () => {
    if (csvError && (!csvData || csvData.length === 0)) return true;
    if (loadingTimeout && (!csvData || csvData.length === 0) && !demandData?.length) return true;
    if (csvError?.code === 'unauthenticated' || demandError?.code === 'unauthenticated') return true;
    if (csvError?.code === 'permission-denied' || demandError?.code === 'permission-denied') return true;
    return false;
  };

  if (shouldShowErrorBoundary()) {
    let primaryError = csvError || demandError;
    if (loadingTimeout && !primaryError) {
      primaryError = {
        message: "Loading is taking longer than expected. This might be due to network issues or high server load.",
        code: "timeout",
        isTimeout: true,
      };
    }
    if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Showing error boundary for critical error:', primaryError);
    }
    return (
      <NetworkErrorBoundary
        error={primaryError}
        retry={handleRetry}
        isRetrying={isFetchingCSV || isLoadingDemand}
      />
    );
  }

  const isDashboardLoading =
    isLoadingCSV || (!csvData?.length && !isRefetchingCSV);

  if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Loading diagnosis:', {
      isLoadingCSV, csvDataLength: csvData?.length, isRefetchingCSV,
      isDashboardLoading, userId, paymentDocCount, selectedSbfCode,
    });
  }

  if (isDashboardLoading) {
    const loadingMessage = isLoadingDemand
      ? "Loading market demand data..."
      : "Loading dashboard data...";
    if (envVars.REACT_APP_DEBUG || process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Showing loading spinner:', loadingMessage);
    }
    return (
      <DashboardLoadingSpinner
        isUsingCachedData={isRefetchingCSV && !!csvData}
        loadingMessage={loadingMessage}
      />
    );
  }

  const isDemandLoading = isLoadingDemand && !demandData?.length;
  const shouldShowEmptyState = csvData && csvData.length > 0 && filteredData.length === 0;
  const hasMissingDemandData = !isLoadingDemand && !demandData?.length && selectedSbfCode;

  return (
    <div className="animate-fade-in">
      <ConnectionStatusBar
        isRefetching={isRefetchingCSV || demandData?.isFetching}
        isUsingCachedData={!!csvData && isRefetchingCSV}
        isDarkMode={isDarkMode}
      />

      {(demandError || (csvError && csvData?.length > 0) || hasMissingDemandData) && (
        <WarningBanner
          message={
            demandError
              ? "We're working to resolve the issue with market demand data. In the meantime, you can still explore all supply data and features below."
              : hasMissingDemandData
              ? "Demand data for this SBF code is being updated. All supply data and features remain available for your review."
              : "Some data may be outdated. Please refresh if needed."
          }
          isDarkMode={isDarkMode}
          onRetry={demandError ? () => refetchDemand() : csvError ? () => refetchCSV() : undefined}
        />
      )}

      <Filters
        data={csvData}
        onFilter={handleFilter}
        isDarkMode={isDarkMode}
        sbfCode={selectedSbfCode}
        onSbfCodeChange={setSelectedSbfCode}
        ref={filtersRef}
        includeLrt={includeLrt}
        onIncludeLrtChange={setIncludeLrt}
        accessibleSbfCodes={accessibleSbfCodes}
      />

      {shouldShowEmptyState ? (
        <div className="mx-4 mt-6">
          <Card className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No units match your filters
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Try adjusting your filter criteria to see available units.
            </p>
            <button
              onClick={() => filtersRef.current?.resetFilters()}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </Card>
        </div>
      ) : (
        <>
          <WarningBanner />

          <div className="max-w-full mx-auto mb-10 space-y-6 mt-2">
            {/* Data Table */}
            <section>
              <DataTable data={filteredData} isDarkMode={isDarkMode} includeLrt={includeLrt} />
            </section>

            {/* Demand loading skeleton */}
            {isDemandLoading && (
              <Card className="p-6">
                <div className="flex items-center justify-center h-28 gap-3">
                  <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading market demand data...</span>
                </div>
              </Card>
            )}

            {/* Supply vs Demand Chart */}
            {demandData?.length && (
              <Card className="p-5">
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
              </Card>
            )}

            {/* Investment & Market Intelligence */}
            <section>
              <SectionHeading
                icon="💰"
                title="Investment Analysis & Market Intelligence"
                subtitle="ROI projections, location insights, and market timing analysis"
              />

              <div className="space-y-5">
                <Card className="p-5">
                  <ROIAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
                </Card>

                <Card className="p-5">
                  <SectionHeading
                    icon="📍"
                    title="Location Map"
                    subtitle="Interactive map showing all filtered properties with color-coded markers by flat type"
                  />
                  <FlatMap data={filteredData} isDarkMode={isDarkMode} />
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <Card className="p-5">
                    <RemainingLeaseAnalysisChart data={filteredData} isDarkMode={isDarkMode} />
                  </Card>
                  <Card className="p-5">
                    <CompletionTimelineChart data={filteredData} isDarkMode={isDarkMode} />
                  </Card>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
