import React, { useMemo, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import LogsFilterBar from "./LogsFilterBar";
import LogsTable from "./LogsTable";
import LogDetailDrawer from "./LogDetailDrawer";
import { COMMUNICATION_LOGS, LOG_TYPES, LOG_CHANNELS, LOG_STATUSES, LOG_DATA_ANCHOR } from "./data/mockCommunicationLogs";
import { filterLogs, sortLogs, computeFacetCounts, resolveDateRange } from "./logsFilterUtils";

const PAGE_SIZE = 25;
const DEFAULT_DATE_FILTER = { preset: "last_30_days", customRange: null };

function toOptions(countsMap, universe) {
  return universe.filter((value) => countsMap.has(value)).map((value) => ({ value, count: countsMap.get(value) }));
}

export default function CommunicationLogsTab() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(DEFAULT_DATE_FILTER);
  const [typeSelected, setTypeSelected] = useState(new Set());
  const [channelSelected, setChannelSelected] = useState(new Set());
  const [statusSelected, setStatusSelected] = useState(new Set());
  const [errorSelected, setErrorSelected] = useState(new Set());
  const [sort, setSort] = useState({ field: "sentAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  const dateRange = useMemo(
    () => resolveDateRange(dateFilter.preset, dateFilter.customRange, LOG_DATA_ANCHOR),
    [dateFilter]
  );

  const filters = useMemo(
    () => ({
      dateRange,
      search,
      types: typeSelected,
      channels: channelSelected,
      statuses: statusSelected,
      errors: errorSelected,
    }),
    [dateRange, search, typeSelected, channelSelected, statusSelected, errorSelected]
  );

  const filteredRows = useMemo(() => filterLogs(COMMUNICATION_LOGS, filters), [filters]);
  const sortedRows = useMemo(() => sortLogs(filteredRows, sort), [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const typeOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["types"] }), "types"), LOG_TYPES),
    [filters]
  );
  const channelOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["channels"] }), "channels"), LOG_CHANNELS),
    [filters]
  );
  const statusOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["statuses"] }), "statuses"), LOG_STATUSES),
    [filters]
  );
  const errorOptions = useMemo(() => {
    const counts = computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["errors"] }), "errors");
    return [...counts.entries()].map(([value, count]) => ({ value, count }));
  }, [filters]);

  function withPageReset(setter) {
    return (next) => {
      setter(next);
      setPage(1);
    };
  }

  function handleClearAll() {
    setSearch("");
    setDateFilter(DEFAULT_DATE_FILTER);
    setTypeSelected(new Set());
    setChannelSelected(new Set());
    setStatusSelected(new Set());
    setErrorSelected(new Set());
    setPage(1);
  }

  function handleSortChange(field) {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));
  }

  return (
    <div data-testid="communication-logs-tab" className="space-y-3">
      <p className="text-[13px] text-text-muted" data-testid="logs-result-count">
        {sortedRows.length} log{sortedRows.length === 1 ? "" : "s"}
      </p>
      <LogsFilterBar
        search={search}
        onSearchChange={withPageReset(setSearch)}
        dateFilter={dateFilter}
        onDateFilterChange={withPageReset(setDateFilter)}
        typeOptions={typeOptions}
        typeSelected={typeSelected}
        onTypeChange={withPageReset(setTypeSelected)}
        channelOptions={channelOptions}
        channelSelected={channelSelected}
        onChannelChange={withPageReset(setChannelSelected)}
        statusOptions={statusOptions}
        statusSelected={statusSelected}
        onStatusChange={withPageReset(setStatusSelected)}
        errorOptions={errorOptions}
        errorSelected={errorSelected}
        onErrorChange={withPageReset(setErrorSelected)}
        onClearAll={handleClearAll}
      />
      <LogsTable rows={pageRows} sort={sort} onSortChange={handleSortChange} onRowClick={setSelectedRow} />
      {totalPages > 1 && (
        <Pagination data-testid="logs-pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" data-testid="logs-page-prev" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink href="#" isActive={p === currentPage} data-testid={`logs-page-${p}`} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" data-testid="logs-page-next" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <LogDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
