import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";

const DataTable = ({ data, isDarkMode, includeLrt }) => {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const QuotaCell = ({ value }) => {
    const hasQuota = value > 0;
    return (
      <span className="inline-block text-lg">
        {hasQuota ? "✅" : "❌"}
      </span>
    );
  };

  const columns = useMemo(
    () => [
      { header: "SBF Launch", accessorKey: "sbfCode", enableSorting: true },
      { header: "Town", accessorKey: "project_town", enableSorting: true },
      { header: "Project", accessorKey: "project_name", enableSorting: true },
      { header: "Flat Type", accessorKey: "flat_type", enableSorting: true },
      { header: "Block", accessorKey: "block", enableSorting: true },
      { header: "Unit", accessorKey: "unit", enableSorting: true },
      {
        header: "Price",
        accessorKey: "price",
        enableSorting: true,
        cell: info =>
          info.getValue() !== null && info.getValue() !== undefined
            ? new Intl.NumberFormat("en-SG").format(info.getValue())
            : "-",
      },
      { header: "Size (sqm)", accessorKey: "size_sqm", enableSorting: true },
      { header: "PSF", accessorKey: "price_psf", enableSorting: true },
      {
        header: "Est. Resale Value",
        accessorKey: "approximate_resale_value",
        enableSorting: true,
        cell: info =>
          info.getValue() !== null && info.getValue() !== undefined
            ? new Intl.NumberFormat("en-SG").format(info.getValue())
            : "-",
      },
      { header: "Max Lease (years)", accessorKey: "max_lease", enableSorting: true },
      // Conditional MRT/LRT columns
      ...(includeLrt ? [
        { header: "Nearest MRT/LRT", accessorKey: "nearest_mrt_lrt", enableSorting: true },
        { header: "Walking Dist to MRT/LRT (m)", accessorKey: "mrt_lrt_walking_distance_in_m", enableSorting: true },
        { header: "Walking Time to MRT/LRT (mins)", accessorKey: "mrt_lrt_walking_time_in_mins", enableSorting: true },
      ] : [
        { header: "Nearest MRT", accessorKey: "nearest_mrt", enableSorting: true },
        { header: "Walking Dist to MRT (m)", accessorKey: "walking_distance_in_m", enableSorting: true },
        { header: "Walking Time to MRT (mins)", accessorKey: "walking_time_in_mins", enableSorting: true },
      ]),
      // Ethnic Quotas
      { header: "Chinese Quota", accessorKey: "chinese_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      { header: "Malay Quota", accessorKey: "malay_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      { header: "Indian & Others Quota", accessorKey: "indian_and_other_races_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      {
        header: "Est. TOP Date (incl delay)",
        accessorKey: "top_delay_date",
        enableSorting: true,
      },
      {
        header: "Repurchased?",
        accessorKey: "repurchased",
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="inline-block text-lg">
              {value === true ? "✅" : value === false ? "❌" : "—"}
            </span>
          );
        },
      },
    ],
    [includeLrt]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <div className={`p-8 text-center ${isDarkMode ? "text-slate-300" : "text-slate-600"} bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md`}>
        <p className="text-lg font-medium">No units matching your current filters</p>
        <p className="mt-2">Try adjusting your selection criteria</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Row with Title and Export Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
          SBF Units
        </h2>

        <button
          onClick={() => exportToCSV(table.getPaginationRowModel().rows, columns)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-200
            ${isDarkMode
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
            }`}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export to CSV
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className={`${isDarkMode ? "bg-gray-800" : "bg-white"} sticky top-0 z-10`}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUpIcon className="h-4 w-4" />}
                        {header.column.getIsSorted() === "desc" && <ChevronDownIcon className="h-4 w-4" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : ""}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Add Placeholder Rows if Less Than 10 Records */}
              {table.getRowModel().rows.length < 10 &&
                Array.from({ length: 10 - table.getRowModel().rows.length }).map((_, idx) => (
                  <tr key={`placeholder-${idx}`} className="bg-transparent">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-800" : "text-gray-50"}`}>
                        -
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Outside of Scroll */}
        <div className={`w-full flex flex-col items-center p-4`}>
          {/* Pagination Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-md ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} disabled:opacity-50`}
            >
              {"<<"}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-md ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} disabled:opacity-50`}
            >
              {"<"}
            </button>

            {/* Page Information */}
            <span className={`mx-2 text-xs sm:text-sm self-center whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-md ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} disabled:opacity-50`}
            >
              {">"}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-md ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} disabled:opacity-50`}
            >
              {">>"}
            </button>
          </div>

          {/* Showing X-Y of Z Records */}
          <span className={`text-xs sm:text-sm mt-2 whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Showing{" "}
            {Math.min(
              table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
              data.length
            )}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length
            )}{" "}
            of {data.length} records
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataTable;

const exportToCSV = (rows, columns, filename = "export.csv") => {
  const headers = columns.map(col => col.header);
  const keys = columns.map(col => col.accessorKey);

  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      keys.map(key => {
        const cell = row.original[key];
        return typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};