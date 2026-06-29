import { useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { isReadOnlyRole } from "../lib/access";

interface Column {
  header: string;
  accessor: string;
  sortable?: boolean;
  type?: "date" | "string" | "number";
  render?: (value: any, row?: any) => React.ReactNode;
}

interface SelectOption {
  label: string;
  value: string;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface SortOption {
  label: string;
  value: string;
}

interface RowAction {
  label: string;
  onClick: (row: any) => void;
  className?: string;
  canShow?: (row: any) => boolean;
}

interface PeriodFilterConfig {
  enabled?: boolean;
  monthAccessor?: string;
  yearAccessor?: string;
  monthOptions?: SelectOption[];
  yearOptions?: SelectOption[];
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  onCreate?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  showCreateButton?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  itemsPerPage?: number;
  searchOptions?: SelectOption[];
  sortOptions?: SortOption[];
  defaultSort?: SortConfig;
  periodFilter?: PeriodFilterConfig;
  canEditRow?: (row: any) => boolean;
  canDeleteRow?: (row: any) => boolean;
  rowActions?: RowAction[];
  showExportButton?: boolean;
  onExportExcel?: (rows: any[]) => void;
  exportButtonLabel?: string;
}

const formatStatusLabel = (status: string) => {
  if (!status) return "-";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-red-100", text: "text-red-700" },
  operator: { bg: "bg-blue-100", text: "text-blue-700" },
  user: { bg: "bg-green-100", text: "text-green-700" },
  bendahara: { bg: "bg-purple-100", text: "text-purple-700" },
  reads: { bg: "bg-sky-100", text: "text-sky-700" },
};

const statusBadgeColors: Record<string, { bg: string; text: string }> = {
  belum_dicatat: { bg: "bg-yellow-100", text: "text-yellow-700" },
  sudah_dicatat: { bg: "bg-green-100", text: "text-green-700" },
  lunas: { bg: "bg-green-100", text: "text-green-700" },
  belum_lunas: { bg: "bg-orange-100", text: "text-orange-700" },
  belum_bayar: { bg: "bg-orange-100", text: "text-orange-700" },
  menunggak: { bg: "bg-red-100", text: "text-red-700" },
  aktif: { bg: "bg-emerald-100", text: "text-emerald-700" },
  nonaktif: { bg: "bg-gray-200", text: "text-gray-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  gagal: { bg: "bg-rose-100", text: "text-rose-700" },
  sukses: { bg: "bg-green-100", text: "text-green-700" },
};

const MONTH_LABELS: Record<number, string> = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

const MONTH_INDEX: Record<string, number> = Object.entries(MONTH_LABELS).reduce(
  (acc, [value, label]) => {
    acc[label.toLowerCase()] = Number(value);
    return acc;
  },
  {} as Record<string, number>,
);

const getRoleBadgeColor = (role: string) =>
  roleBadgeColors[role?.toLowerCase()] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

const getStatusBadgeColor = (status: string) =>
  statusBadgeColors[status?.toLowerCase()] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

const normalizeComparable = (value: unknown): string | number => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const numericValue = Number(raw);
  if (!Number.isNaN(numericValue)) return numericValue;

  const monthValue = MONTH_INDEX[raw.toLowerCase()];
  if (monthValue) return monthValue;

  const dateValue = new Date(raw);
  if (!Number.isNaN(dateValue.getTime())) return dateValue.getTime();

  return raw.toLowerCase();
};

const buildDefaultSortOptions = (columns: Column[]): SortOption[] =>
  columns
    .filter((column) => column.sortable)
    .map((column) => ({ label: column.header, value: column.accessor }));

const CURRENCY_ACCESSOR_KEYWORDS = [
  "total",
  "tagihan",
  "nominal",
  "pendapatan",
  "tunggakan",
  "bayar",
  "harga",
  "biaya",
  "jumlah",
];

const formatCurrency = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value ?? "-";
  return `Rp ${numeric.toLocaleString("id-ID")}`;
};

const formatDateIndonesia = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const isCurrencyAccessor = (accessor: string) => {
  const normalized = accessor.toLowerCase();
  return CURRENCY_ACCESSOR_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
};

const getDisplayValue = (row: any, accessor: string) => {
  if (accessor === "status") return formatStatusLabel(row[accessor] ?? "");
  if (accessor === "bulan")
    return MONTH_LABELS[Number(row[accessor])] ?? row[accessor];
  if (accessor === "tanggal_bayar") return formatDateIndonesia(row[accessor]);
  if (accessor === "total_transaksi") {
    const numeric = Number(row[accessor]);
    if (!Number.isFinite(numeric)) return row[accessor] ?? "-";
    return numeric.toLocaleString("id-ID");
  }
  if (accessor === "lama_tunggakan") {
    const numeric = Number(row[accessor]);
    if (!Number.isFinite(numeric)) return row[accessor] ?? "-";
    return `${numeric} bulan`;
  }
  if (isCurrencyAccessor(accessor)) return formatCurrency(row[accessor]);
  return row[accessor] ?? "-";
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const shouldForceExcelText = (accessor: string, value: string) => {
  const normalizedAccessor = accessor.toLowerCase();
  if (normalizedAccessor === "alamat") return true;

  // Keep values like 01/07 as text so Excel doesn't auto-convert to date.
  return /^0\d+\/\d+$/.test(value.trim());
};

export default function DataTable({
  title,
  columns,
  data,
  onCreate,
  onEdit,
  onDelete,
  showCreateButton = true,
  showEdit = true,
  showDelete = true,
  editLabel = "Edit",
  deleteLabel = "Hapus",
  itemsPerPage = 10,
  searchOptions,
  sortOptions,
  defaultSort,
  periodFilter,
  canEditRow,
  canDeleteRow,
  rowActions = [],
  showExportButton = true,
  onExportExcel,
  exportButtonLabel = "Export Excel",
}: DataTableProps) {
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<string>(
    searchOptions?.[0]?.value || "__all",
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSort || null,
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const monthAccessor = periodFilter?.monthAccessor || "bulan";
  const yearAccessor = periodFilter?.yearAccessor || "tahun";
  const periodFilterEnabled = !!periodFilter?.enabled;

  const availableSortOptions = useMemo(() => {
    if (sortOptions && sortOptions.length > 0) return sortOptions;
    return buildDefaultSortOptions(columns);
  }, [columns, sortOptions]);

  const availableMonthOptions = useMemo(() => {
    if (periodFilter?.monthOptions?.length) return periodFilter.monthOptions;

    const values = Array.from(
      new Set(
        data
          .map((row) => row[monthAccessor])
          .filter(
            (value) => value !== null && value !== undefined && value !== "",
          ),
      ),
    );

    return values
      .map((value) => {
        const normalized = normalizeComparable(value);
        const numericMonth =
          typeof normalized === "number" && normalized >= 1 && normalized <= 12
            ? normalized
            : null;
        return {
          label:
            numericMonth !== null ? MONTH_LABELS[numericMonth] : String(value),
          value: String(value),
          sortValue: numericMonth || String(normalized),
        };
      })
      .sort((a, b) => {
        if (
          typeof a.sortValue === "number" &&
          typeof b.sortValue === "number"
        ) {
          return a.sortValue - b.sortValue;
        }
        return String(a.sortValue).localeCompare(String(b.sortValue));
      })
      .map(({ label, value }) => ({ label, value }));
  }, [data, monthAccessor, periodFilter?.monthOptions]);

  const availableYearOptions = useMemo(() => {
    if (periodFilter?.yearOptions?.length) return periodFilter.yearOptions;

    const values = Array.from(
      new Set(
        data
          .map((row) => row[yearAccessor])
          .filter(
            (value) => value !== null && value !== undefined && value !== "",
          ),
      ),
    );

    return values
      .map((value) => ({
        label: String(value),
        value: String(value),
        sortValue: normalizeComparable(value),
      }))
      .sort((a, b) => {
        if (
          typeof a.sortValue === "number" &&
          typeof b.sortValue === "number"
        ) {
          return b.sortValue - a.sortValue;
        }
        return String(b.sortValue).localeCompare(String(a.sortValue));
      })
      .map(({ label, value }) => ({ label, value }));
  }, [data, yearAccessor, periodFilter?.yearOptions]);

  const effectiveShowCreateButton = showCreateButton && !isReadOnly;
  const effectiveShowEdit = showEdit && !isReadOnly;
  const effectiveShowDelete = showDelete && !isReadOnly;
  const effectiveShowExportButton = showExportButton && !isReadOnly;
  const effectiveRowActions = isReadOnly ? [] : rowActions;
  const hasRowActions = effectiveRowActions.length > 0;

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return data.filter((row) => {
      if (periodFilterEnabled) {
        if (
          selectedMonth !== "all" &&
          String(row[monthAccessor]) !== selectedMonth
        ) {
          return false;
        }
        if (
          selectedYear !== "all" &&
          String(row[yearAccessor]) !== selectedYear
        ) {
          return false;
        }
      }

      if (!keyword) return true;

      if (searchField !== "__all") {
        return String(row[searchField] ?? "")
          .toLowerCase()
          .includes(keyword);
      }

      return columns.some((col) =>
        String(row[col.accessor] ?? "")
          .toLowerCase()
          .includes(keyword),
      );
    });
  }, [
    columns,
    data,
    monthAccessor,
    periodFilterEnabled,
    searchField,
    searchTerm,
    selectedMonth,
    selectedYear,
    yearAccessor,
  ]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = normalizeComparable(a[sortConfig.key]);
      const bValue = normalizeComparable(b[sortConfig.key]);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortConfig.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (accessor: string, sortable: boolean = false) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev?.key === accessor) {
        return {
          key: accessor,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: accessor, direction: "asc" };
    });
    setCurrentPage(1);
  };

  const handleExportExcelDefault = () => {
    const headers = columns.map((column) => column.header);

    const tableHeaderHtml = headers
      .map((header) => `<th>${escapeHtml(header)}</th>`)
      .join("");
    const tableRowsHtml = sortedData
      .map(
        (row) =>
          `<tr>${columns
            .map((column) => {
              const cell = String(getDisplayValue(row, column.accessor));
              const forceText = shouldForceExcelText(column.accessor, cell);
              const cellStyle = forceText ? ` style="mso-number-format:'\\@';"` : "";
              return `<td${cellStyle}>${escapeHtml(cell)}</td>`;
            })
            .join("")}</tr>`,
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead><tr>${tableHeaderHtml}</tr></thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `${(title || "data").toLowerCase().replaceAll(" ", "_")}.xls`;
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcelCustom = () => {
    onExportExcel?.(sortedData);
  };

  const getPaginationRange = () => {
    const delta = 2; // jumlah halaman kiri & kanan dari current
    const range: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);

    if (left > 2) {
      range.push("...");
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < totalPages - 1) {
      range.push("...");
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {sortedData.length} data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {effectiveShowExportButton && (
            <>
              {onExportExcel && (
                <button
                  onClick={handleExportExcelDefault}
                  className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200"
                >
                  Export Excel
                </button>
              )}
              <button
                onClick={
                  onExportExcel
                    ? handleExportExcelCustom
                    : handleExportExcelDefault
                }
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all duration-200"
              >
                {onExportExcel ? exportButtonLabel : "Export Excel"}
              </button>
            </>
          )}
          {effectiveShowCreateButton && (
            <button
              onClick={onCreate}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 active:scale-95"
            >
              + Tambah Data
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>

          {searchOptions && searchOptions.length > 0 && (
            <select
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[180px] px-3 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="__all">Semua Kolom</option>
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {availableSortOptions.length > 0 && (
            <>
              <select
                value={sortConfig?.key || ""}
                onChange={(e) => {
                  const nextKey = e.target.value;
                  if (!nextKey) {
                    setSortConfig(null);
                  } else {
                    setSortConfig((prev) => ({
                      key: nextKey,
                      direction: prev?.direction || "asc",
                    }));
                  }
                  setCurrentPage(1);
                }}
                className="min-w-[200px] px-3 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tanpa Urutan</option>
                {availableSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Urut: {option.label}
                  </option>
                ))}
              </select>

              <select
                value={sortConfig?.direction || "asc"}
                onChange={(e) => {
                  const direction = e.target.value as "asc" | "desc";
                  setSortConfig((prev) => {
                    if (!prev) return null;
                    return { ...prev, direction };
                  });
                  setCurrentPage(1);
                }}
                disabled={!sortConfig}
                className="min-w-[140px] px-3 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="asc">Naik</option>
                <option value="desc">Turun</option>
              </select>
            </>
          )}
        </div>

        {periodFilterEnabled && (
          <div className="flex flex-col lg:flex-row gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[180px] px-3 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Bulan</option>
              {availableMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[180px] px-3 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Tahun</option>
              {availableYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700 w-12">
                  <div className="text-center">No.</div>
                </th>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(col.accessor, col.sortable)}
                    className={`text-left px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700 ${
                      col.sortable ? "cursor-pointer hover:bg-gray-200" : ""
                    } transition-colors duration-150`}
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {col.header}
                      {col.sortable && sortConfig?.key === col.accessor && (
                        <span className="text-xs font-bold text-blue-600">
                          {sortConfig.direction === "asc" ? "ASC" : "DESC"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {(effectiveShowEdit || effectiveShowDelete || hasRowActions) && (
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-center font-semibold text-gray-700">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="text-center py-8 text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      Tidak ada data
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-gray-700 text-center font-medium">
                      {startIndex + rowIndex + 1}
                    </td>
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-3 sm:px-6 sm:py-4 text-gray-700"
                      >
                        {col.render ? (
                          col.render(row[col.accessor], row)
                        ) : col.accessor === "role" ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(row[col.accessor]).bg} ${getRoleBadgeColor(row[col.accessor]).text}`}
                          >
                            {row[col.accessor]}
                          </span>
                        ) : col.accessor === "status" ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(row[col.accessor]).bg} ${getStatusBadgeColor(row[col.accessor]).text}`}
                          >
                            {getDisplayValue(row, col.accessor)}
                          </span>
                        ) : col.accessor === "bulan" ? (
                          getDisplayValue(row, col.accessor)
                        ) : (
                          getDisplayValue(row, col.accessor)
                        )}
                      </td>
                    ))}

                    {(effectiveShowEdit || effectiveShowDelete || hasRowActions) && (
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {effectiveRowActions.map((action, actionIndex) => {
                            if (action.canShow && !action.canShow(row)) {
                              return null;
                            }

                            return (
                              <button
                                key={`${action.label}-${actionIndex}`}
                                onClick={() => action.onClick(row)}
                                className={
                                  action.className ||
                                  "inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-150 border border-amber-200"
                                }
                              >
                                {action.label}
                              </button>
                            );
                          })}

                          {effectiveShowEdit &&
                            (!canEditRow || canEditRow(row)) && (
                            <button
                              onClick={() => onEdit?.(row)}
                              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-150 border border-blue-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              {editLabel}
                            </button>
                          )}

                          {effectiveShowDelete &&
                            (!canDeleteRow || canDeleteRow(row)) && (
                              <button
                                onClick={() => onDelete?.(row)}
                                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-150 border border-red-200"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                {deleteLabel}
                              </button>
                            )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600 font-medium">
            Menampilkan{" "}
            <span className="text-blue-600 font-semibold">
              {paginatedData.length > 0 ? startIndex + 1 : 0}
            </span>
            {" - "}
            <span className="text-blue-600 font-semibold">
              {Math.min(startIndex + itemsPerPage, sortedData.length)}
            </span>
            {" dari "}
            <span className="text-blue-600 font-semibold">
              {sortedData.length}
            </span>{" "}
            data
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 hover:shadow-sm"
            >
              Sebelumnya
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {getPaginationRange().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-2 text-gray-400 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <div className="sm:hidden rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
              Hal {currentPage}/{totalPages}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 hover:shadow-sm"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
