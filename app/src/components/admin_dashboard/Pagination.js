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
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`px-3 py-1 rounded text-sm ${
              n === pageSafe
                ? 'bg-blue-600 text-white'
                : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
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