import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, MessageCircle, Mail, MessageSquare, MessageCircleMore, PhoneCall } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatLogTimestamp } from "./logsFilterUtils";

const CHANNEL_ICON = {
  WhatsApp: MessageCircle,
  Email: Mail,
  SMS: MessageSquare,
  RCS: MessageCircleMore,
  "AI Calling": PhoneCall,
};

const STATUS_STYLE = {
  Delivered: "bg-emerald-50 text-emerald-700",
  Read: "bg-emerald-50 text-emerald-700",
  Sent: "bg-slate-100 text-slate-700",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-red-50 text-red-700",
  Bounced: "bg-red-50 text-red-700",
};

const SORTABLE_LABELS = { sentAt: "Sent Timestamp", updatedAt: "Last Update Time" };

function SortHeader({ field, sort, onSortChange }) {
  const isActive = sort.field === field;
  const Icon = !isActive ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      data-testid={`logs-sort-${field}`}
      onClick={() => onSortChange(field)}
      className={`inline-flex items-center gap-1 hover:text-text-primary transition-colors ${isActive ? "text-text-primary" : ""}`}
    >
      {SORTABLE_LABELS[field]}
      <Icon className="w-3 h-3" />
    </button>
  );
}

export default function LogsTable({ rows, sort, onSortChange, onRowClick }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="logs-table-empty"
        className="flex flex-col items-center justify-center gap-2 py-16 text-text-muted bg-surface border border-border rounded-lg"
      >
        <p className="text-sm">No logs match your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="logs-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader field="sentAt" sort={sort} onSortChange={onSortChange} /></TableHead>
            <TableHead>Engage ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Template Name</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Delivery Status</TableHead>
            <TableHead>Error Response</TableHead>
            <TableHead><SortHeader field="updatedAt" sort={sort} onSortChange={onSortChange} /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const ChannelIcon = CHANNEL_ICON[row.channel];
            return (
              <TableRow key={row.id} data-testid={`logs-row-${row.id}`} onClick={() => onRowClick(row)} className="cursor-pointer">
                <TableCell className="whitespace-nowrap text-[13px]">{formatLogTimestamp(row.sentAt)}</TableCell>
                <TableCell className="text-[13px]">{row.engageId}</TableCell>
                <TableCell className="text-[13px]">{row.phone || row.email}</TableCell>
                <TableCell><Badge variant="outline">{row.type}</Badge></TableCell>
                <TableCell className="text-[13px] max-w-[180px] truncate" title={row.templateName}>{row.templateName}</TableCell>
                <TableCell className="text-[13px]">
                  <span className="inline-flex items-center gap-1.5">
                    {ChannelIcon && <ChannelIcon className="w-3.5 h-3.5 text-text-muted" />}
                    {row.channel}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[row.deliveryStatus]}`}>
                    {row.deliveryStatus}
                  </span>
                </TableCell>
                <TableCell className="text-[13px] max-w-[200px] truncate text-text-muted" title={row.errorResponse || undefined}>
                  {row.errorResponse || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[13px]">{formatLogTimestamp(row.updatedAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
