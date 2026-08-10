import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatLogTimestamp } from "./logsFilterUtils";

const FIELD_ROWS = [
  { key: "sentAt", label: "Sent Timestamp", format: formatLogTimestamp },
  { key: "engageId", label: "Engage ID" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "type", label: "Type" },
  { key: "templateName", label: "Template Name" },
  { key: "channel", label: "Communication Channel" },
  { key: "senderPhone", label: "Sender Phone Number" },
  { key: "senderEmail", label: "Sender Email" },
  { key: "deliveryStatus", label: "Delivery Status" },
  { key: "aiCallDurationSec", label: "AI Call Duration", format: (s) => `${s}s`, showIf: (row) => row.channel === "AI Calling" },
  { key: "errorResponse", label: "Error Response" },
  { key: "updatedAt", label: "Last Update Time", format: formatLogTimestamp },
];

export default function LogDetailDrawer({ row, onClose }) {
  const open = row != null;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent data-testid="log-detail-drawer">
        <SheetHeader>
          <SheetTitle>{row?.engageId}</SheetTitle>
          <SheetDescription>{row?.templateName}</SheetDescription>
        </SheetHeader>
        <dl className="mt-4 space-y-3">
          {row &&
            FIELD_ROWS.filter((f) => !f.showIf || f.showIf(row)).map((f) => {
              const rawValue = row[f.key];
              const value = rawValue == null ? "—" : f.format ? f.format(rawValue) : String(rawValue);
              return (
                <div key={f.key} className="flex items-start justify-between gap-4" data-testid={`log-detail-field-${f.key}`}>
                  <dt className="text-[12px] text-text-muted">{f.label}</dt>
                  <dd className="text-[13px] text-text-primary text-right">{value}</dd>
                </div>
              );
            })}
        </dl>
      </SheetContent>
    </Sheet>
  );
}
