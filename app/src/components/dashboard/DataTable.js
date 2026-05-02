import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const QuotaCell = ({ value }) => (
  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
    value > 0
      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
      : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
  }`}>
    {value > 0 ? "✓" : "✕"}
  </span>
);

const DataTable = ({ data, isDarkMode, includeLrt }) => {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

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
          info.getValue() != null
            ? `$${new Intl.NumberFormat("en-SG").format(info.getValue())}`
            : "—",
      },
      { header: "Size (sqm)", accessorKey: "size_sqm", enableSorting: true },
      { header: "PSF", accessorKey: "price_psf", enableSorting: true },
      {
        header: "Est. Resale Value",
        accessorKey: "approximate_resale_value",
        enableSorting: true,
        cell: info =>
          info.getValue() != null
            ? `$${new Intl.NumberFormat("en-SG").format(info.getValue())}`
            : "—",
      },
      { header: "Max Lease (yrs)", accessorKey: "max_lease", enableSorting: true },
      ...(includeLrt ? [
        { header: "Nearest MRT/LRT", accessorKey: "nearest_mrt_lrt", enableSorting: true },
        { header: "Walking Dist (m)", accessorKey: "mrt_lrt_walking_distance_in_m", enableSorting: true },
        { header: "Walking Time (min)", accessorKey: "mrt_lrt_walking_time_in_mins", enableSorting: true },
      ] : [
        { header: "Nearest MRT", accessorKey: "nearest_mrt", enableSorting: true },
        { header: "Walking Dist (m)", accessorKey: "walking_distance_in_m", enableSorting: true },
        { header: "Walking Time (min)", accessorKey: "walking_time_in_mins", enableSorting: true },
      ]),
      { header: "Chinese Quota", accessorKey: "chinese_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      { header: "Malay Quota", accessorKey: "malay_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      { header: "Indian & Others Quota", accessorKey: "indian_and_other_races_quota", enableSorting: true, cell: ({ getValue }) => <QuotaCell value={getValue()} /> },
      { header: "Est. TOP Date", accessorKey: "top_delay_date", enableSorting: true },
      {
        header: "Repurchased",
        accessorKey: "repurchased",
        enableSorting: true,
        cell: ({ getValue }) => {
          const value = getValue();
          return value === true
            ? <QuotaCell value={1} />
            : value === false
            ? <QuotaCell value={0} />
            : <span className="text-gray-400 dark:text-gray-600">—</span>;
        },
      },
    ],
    [includeLrt]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-card">
        <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No units matching your filters</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your selection criteria</p>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, data.length);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SBF Units</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.length.toLocaleString()} total records</p>
        </div>
        <button
          onClick={() => exportToCSV(table.getPaginationRowModel().rows, columns)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm"
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={[
                        "px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap",
                        header.column.getCanSort() ? "cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-200" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUpIcon className="h-3 w-3 text-brand-500 shrink-0" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDownIcon className="h-3 w-3 text-brand-500 shrink-0" />
                        )}
                        {header.column.getCanSort() && !header.column.getIsSorted() && (
                          <span className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40">↕</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={[
                    "transition-colors duration-75",
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50/50 dark:bg-gray-800/30",
                    "hover:bg-brand-50/50 dark:hover:bg-brand-900/10",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Showing {from}–{to} of {data.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} label="First">
              «
            </PaginationBtn>
            <PaginationBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} label="Previous">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </PaginationBtn>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <PaginationBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} label="Next">
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </PaginationBtn>
            <PaginationBtn onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} label="Last">
              »
            </PaginationBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaginationBtn = ({ children, disabled, onClick, label }) => (
  <button
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
  >
    {children}
  </button>
);

const exportToCSV = (rows, columns, filename = "sbf-units.csv") => {
  const headers = columns.map(col => col.header);
  const keys = columns.map(col => col.accessorKey);

  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      keys.map(key => {
        const cell = row.original[key];
        return typeof cell === "string" && cell.includes(",") ? `"${cell}"` : (cell ?? "");
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default DataTable;
