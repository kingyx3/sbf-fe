import React from "react";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  startIdx, 
  endIdx, 
  totalItems, 
  onPageChange, 
  isDarkMode 
}) => {
  const pageSafe = Math.min(Math.max(1, currentPage), totalPages);

  // Smart pagination: show first, last, and pages around current (±3 range)
  const getPageNumbers = () => {
    if (totalPages <= 10) {
      // Show all pages if 10 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const showFirst = true;
    const showLast = true;
    
    // Always show first page
    if (showFirst) {
      pages.push(1);
    }

    // Calculate range around current page (3 before and 3 after)
    const rangeStart = Math.max(2, pageSafe - 3);
    const rangeEnd = Math.min(totalPages - 1, pageSafe + 3);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    if (showLast && totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Showing <span className="font-medium">{totalItems === 0 ? 0 : startIdx + 1}</span>–
        <span className="font-medium">{Math.min(endIdx, totalItems)}</span> of{" "}
        <span className="font-medium">{totalItems}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={pageSafe <= 1}
          className={`px-3 py-1 rounded text-sm ${
            pageSafe <= 1
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Prev
        </button>
        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className={`px-2 py-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded text-sm ${
                page === pageSafe
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={pageSafe >= totalPages}
          className={`px-3 py-1 rounded text-sm ${
            pageSafe >= totalPages
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;