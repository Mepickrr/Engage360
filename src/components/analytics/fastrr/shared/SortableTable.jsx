import React, { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { sortRows, nextSort } from "./sortMath";

export default function SortableTable({ testId, columns, rows, defaultSort, secondarySortField, rowKey, maxRows = 10 }) {
  const [sort, setSort] = useState(defaultSort);
  const sorted = sortRows(rows, sort, secondarySortField).slice(0, maxRows);

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <button
                  type="button"
                  data-testid={`${testId}-sort-${col.key}`}
                  onClick={() => setSort((prev) => nextSort(prev, col.key))}
                  className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  {col.label}
                  {sort.field === col.key
                    ? (sort.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                    : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row[rowKey]} data-testid={`${testId}-row-${row[rowKey]}`}>
              {columns.map((col) => (
                <TableCell key={col.key} className="text-[13px]">
                  {col.formatter ? col.formatter(row[col.key]) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2 border-t border-border">
        <button type="button" data-testid={`${testId}-view-all`} disabled className="text-[12px] text-text-muted cursor-not-allowed">
          View all
        </button>
      </div>
    </div>
  );
}
