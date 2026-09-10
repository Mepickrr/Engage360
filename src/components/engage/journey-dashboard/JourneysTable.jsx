import React from "react";
import { Eye, MoreVertical } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { previewToast } from "@/components/common/PreviewHeader";

const PRIMARY = "#6C3AE8";

function MetricCell({ enabled }) {
  return (
    <TableCell className="text-right text-[12px] text-text-secondary tabular-nums">
      {enabled ? "0" : "—"}
    </TableCell>
  );
}

function JourneyRow({ journey: j, enabled, onToggle, onPreview }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <TableRow data-testid={`journey-row-${j.id}`}>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-semibold text-[13px] text-text-primary cursor-default">
              {j.journeyType}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">
            {j.tooltip}
          </TooltipContent>
        </Tooltip>
        <div className="mt-1">
          <Badge variant="outline" className="text-[10px]">
            {j.audience}
          </Badge>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: enabled ? "#22C55E" : "#94A3B8" }}
          />
          <span className="text-[11px] font-medium text-text-secondary">
            {enabled ? "Active" : "Paused"}
          </span>
        </div>
      </TableCell>

      <MetricCell enabled={enabled} />
      <MetricCell enabled={enabled} />
      <MetricCell enabled={enabled} />
      <MetricCell enabled={enabled} />
      <MetricCell enabled={enabled} />
      <MetricCell enabled={enabled} />

      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            data-testid={`journey-toggle-${j.id}`}
            onClick={() => onToggle(j.id)}
            title={enabled ? "Active — click to pause" : "Click to activate"}
            style={{
              position: "relative",
              width: 36,
              height: 20,
              borderRadius: 10,
              flexShrink: 0,
              background: enabled ? PRIMARY : "#E2E8F0",
              border: "none",
              display: "flex",
              alignItems: "center",
              padding: 2,
              transition: "background 0.2s",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "transform 0.2s",
                transform: enabled ? "translateX(16px)" : "translateX(0)",
              }}
            />
          </button>

          <button
            type="button"
            title="Preview"
            data-testid={`journey-preview-${j.id}`}
            onClick={() => onPreview(j.id)}
            className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary hover:text-primary transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More"
                data-testid={`journey-menu-${j.id}`}
                onClick={() => setMenuOpen((open) => !open)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => previewToast()}>
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => previewToast()}>
                Download Order Report
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => previewToast()}>
                Download Error Report
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => previewToast()}>
                Download Conversation Report
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => previewToast()}>
                View All Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function JourneysTable({ journeys, enabledMap, onToggle, onPreview }) {
  return (
    <div data-testid="journeys-table">
      <TooltipProvider delayDuration={150}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Journey Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Opened</TableHead>
              <TableHead className="text-right">Clicked</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journeys.map((j) => (
              <JourneyRow
                key={j.id}
                journey={j}
                enabled={!!enabledMap[j.id]}
                onToggle={onToggle}
                onPreview={onPreview}
              />
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
