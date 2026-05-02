import { useState, useRef, useEffect, useCallback } from "react";
import DataTable from "./DataTable";
import FlatMap from "./FlatMap";
import CountChart from "./CountChart";
import ROIAnalysisChart from "./ROIAnalysisChart";
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

const LOADING_TIMEOUT_MS = 20_000;

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-5">
    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">{title}</h2>
    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card ${className}`}>
    {children}
  </div>
);

const Dashboard = ({ isDarkMode, userId, paymentDocCount, latestSbfCode, accessibleSbfCodes }) => {
  const [selectedSbfCode, setSelectedSbfCode] = useState(latestSbfCode);
  // null = filters haven't run yet; [] = filters ran and returned nothing
  const [filteredData, setFilteredData] = useState(null);
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

  // Stable callback — setFilteredData is always stable so no deps needed
  const handleFilter = useCallback((filteredResults) => {
    setFilteredData(filteredResults);
  }, []);

  // Reset filteredData to null whenever csvData changes so we don't flash a stale empty state
  useEffect(() => {
    setFilteredData(null);
  }, [csvData]);

  // Timeout: only for the initial network fetch, not for settled states
  useEffect(() => {
    if (!isLoadingCSV || envVars.testMode || csvData?.length) return;
    const id = setTimeout(() => setLoadingTimeout(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [isLoadingCSV, csvData?.length]);

  // Clear timeout flag once loading resolves
  useEffect(() => {
    if (!isLoadingCSV) setLoadingTimeout(false);
  }, [isLoadingCSV]);

  const handleRetry = () => {
    setLoadingTimeout(false);
    if (csvError) refetchCSV();
    if (demandError) refetchDemand();
  };

  const hasAuthError =
    csvError?.code === 'unauthenticated' || demandError?.code === 'unauthenticated' ||
    csvError?.code === 'permission-denied' || demandError?.code === 'permission-denied';

  if (hasAuthError || (csvError && !csvData?.length) || loadingTimeout) {
    const primaryError = csvError || demandError || {
      message: "Loading is taking longer than expected. Please check your connection and try again.",
      code: "timeout",
      isTimeout: true,
    };
    return (
      <NetworkErrorBoundary
        error={primaryError}
        retry={handleRetry}
        isRetrying={isFetchingCSV || isLoadingDemand}
      />
    );
  }

  // Only show full-screen spinner during the initial network fetch.
  // Empty data or disabled-query states fall through to the content area.
  if (isLoadingCSV) {
    return (
      <DashboardLoadingSpinner
        isUsingCachedData={isRefetchingCSV && !!csvData}
        loadingMessage="Loading dashboard data..."
      />
    );
  }

  const isDemandLoading = isLoadingDemand && !demandData?.length;
  // null = still filtering; [] = genuinely empty after filter
  const isFilterPending = filteredData === null && csvData?.length > 0;
  const shouldShowEmptyState = !isFilterPending && csvData?.length > 0 && filteredData?.length === 0;
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

      {isFilterPending ? null : shouldShowEmptyState ? (
        <div className="mx-4 mt-6">
          <Card className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">No units match your filters</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filter criteria to see available units.</p>
            <button
              onClick={() => filtersRef.current?.resetFilters()}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </Card>
        </div>
      ) : (
        <>
          <WarningBanner />

          <div className="max-w-full mx-auto mb-10 space-y-6 mt-2">
            <section>
              <DataTable data={filteredData ?? []} isDarkMode={isDarkMode} includeLrt={includeLrt} />
            </section>

            {isDemandLoading && (
              <Card className="p-6">
                <div className="flex items-center justify-center h-28 gap-3">
                  <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-brand-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading market demand data...</span>
                </div>
              </Card>
            )}

            {demandData?.length > 0 && (
              <Card className="p-5">
                <CountChart
                  data={filteredData ?? []}
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

            <section>
              <SectionHeading
                title="Investment Analysis & Market Intelligence"
                subtitle="ROI projections, location insights, and market timing analysis"
              />
              <div className="space-y-5">
                <Card className="p-5">
                  <ROIAnalysisChart data={filteredData ?? []} isDarkMode={isDarkMode} />
                </Card>
                <Card className="p-5">
                  <SectionHeading
                    title="Location Map"
                    subtitle="Interactive map showing all filtered properties with color-coded markers by flat type"
                  />
                  <FlatMap data={filteredData ?? []} isDarkMode={isDarkMode} />
                </Card>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <Card className="p-5">
                    <RemainingLeaseAnalysisChart data={filteredData ?? []} isDarkMode={isDarkMode} />
                  </Card>
                  <Card className="p-5">
                    <CompletionTimelineChart data={filteredData ?? []} isDarkMode={isDarkMode} />
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
